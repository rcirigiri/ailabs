const {AzureChatOpenAI} = require('@langchain/openai');
const moment = require('moment');
const {
  findPolicyByPolicyId,
  findClaimByClaimNumber,
  createClaim,
  createConversation,
  findPolicyByFirstLastAndZipCode,
} = require('../repository');
const {LOG_LEVELS} = require('../utils/constants');

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const INITIAL_CMD = `You are an auto-insurance claim assistant. Your task is to guide users to file the first notice of loss claims or enquire about previous claims by following these steps -
# Step 1 : Enquire about the policy number , If policy number is not available, ask for first name , last name and postal code. Only proceed with the next step once you have information about policy number or (first name , last name and postal code). Else keep requesting either Policy number or (first name , last name and postal code) from the user.
# Step 3 : Ask and Understand the intent of the user, the intent can either be enquiry or new_claim. 
# Only proceed with the next step once you have information about policy number or (first name , last name and postal code) and intent. Else keep requesting information about the missing entity.
# Step 4 : If the user's intent is enquiry, ask them to provide the claim number. Else, if their intent is new claim filing, thank them for sharing their details and let user know that we will begin the process by asking a set of questions, and ask whether user is ready to proceed.
# Step 5 : If user intent is enquiry and claim_number entity is missing, keep requesting for claim number. Else, thank user for sharing the details and ask what user wants to know about the claim.

# If at any point, user's wants to change policy number or claim number or the intent is to ask details about another policy number then start from begining (Step 1) and ask or confirm the policy number or claim number again to continue.

# Try to detect the intent of the user at every step and update the field : intent
# If user changes any of the field values like policy_number, first_name, last_name, postal_code or claim_number then update the values accordingly in the response.

**Response : **
In your response include only the following keys and the entities extracted for these fields
1. policy_number
2. first_name, last_name and postal_code
3. intent
4. claim_number
5. response
Response should strictly be in JSON format.
`;

const EXTRACT_PROMPT = `Analyze the conversation between an insurance claims agent and the user and extract the following relevant entities. If you are unable to find entities for a specific field, leave them empty. Return your response as JSON with the following fields only, do not respond with any other text.

**Example Structure**
      {
        "policyNumber": "",
        "vehicle": "",
        "claimNumber": "",
        "firstName": "",
        "lastName": "",
        "postalCode": "",
        "incidentDate": "",
        "lossLocation": {
          "addressLine": "",
          "state": "",
          "city": "",
          "postalCode": ""
        },
        "vehicleDetails": {
          "licensePlate": "",
          "VIN": "",
          "year": "",
          "make": "",
          "model": ""
        },
        "causeOfLoss": "",
        "vehicleDamageDetails": "",
        "claimSubmitted": false,
        "claimStatus": "pending"
        "imageURL": ""
      }

**Important**
  # If user intend to restart from beginning or intend to change the policy number then response with just a string "RESTART"
  # If user intend to inquire about an existing claim then response with just a string "ENQUIRY"
  # If the conversation is over then ask if you can assist the user with anything else.    
`;

class ChatService {
  constructor(config) {
    this.client = new AzureChatOpenAI(config);
    this.conversationHistories = new Map();
    this.flowState = new Map();
  }

  initializeState(socketId) {
    this.flowState.set(socketId, {
      currentStep: 'INITIAL',
      policyDetails: null,
      claimDetails: null,
      collectedData: {},
      intent: null,
      isStepChanged: false,
    });
  }

  getState(socketId) {
    return this.flowState.get(socketId);
  }

  updateState(socketId, updates) {
    const currentState = this.getState(socketId);
    this.flowState.set(socketId, {...currentState, ...updates});
  }

  parseResponse(res) {
    let parsedResponse = {};
    try {
      if (res.startsWith('```json') && res.endsWith('```')) {
        parsedResponse = JSON.parse(res.slice(7, -3).trim()); // Remove ```json and ```
      } else {
        parsedResponse = JSON.parse(res); // Parse normally if no code block
      }
    } catch (e) {
      //console.log('ERROR parseResponse : ', e);
      parsedResponse = res;
    }
    return parsedResponse;
  }

  async initializeConversation(socketId) {
    this.initializeState(socketId);

    this.conversationHistories.set(socketId, [
      {role: 'system', content: INITIAL_CMD},
    ]);
  }

  async processMessage(socketId, message, image) {
    try {
      const state = this.getState(socketId);
      let response;

      if (state.currentStep === 'NEW_CLAIM' && state.policyDetails) {
        response = await this.handleNewClaimConversation(
          socketId,
          message,
          image,
        );
      } else if (state.currentStep === 'INQUIRY' && state.claimDetails) {
        response = await this.handleInquiryConversation(socketId, message);
      } else {
        response = await this.handleInitialConversation(socketId, message);
      }

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: 'An error occurred while processing your request.',
        error: true,
      };
    }
  }

  async handleInitialConversation(socketId, message) {
    const state = this.getState(socketId);
    if (state.isStepChanged == true) {
      this.conversationHistories.set(socketId, [
        {role: 'system', content: INITIAL_CMD},
      ]);
      this.updateState(socketId, {
        isStepChanged: false,
      });
    }

    const history = this.getConversationHistory(socketId);

    history.push({role: 'user', content: message});

    const response = await this.client.invoke(history);

    let parsedResponse = this.parseResponse(response.content);

    console.log('>>restart', parsedResponse);

    history.push({
      role: 'assistant',
      content: response.content.trim(),
    });
    //console.log(`[ASSISTANT]`, parsedResponse);
    // Handle policy verification
    if (parsedResponse.policy_number) {
      const policy = await findPolicyByPolicyId(parsedResponse.policy_number);
      console.log('policy', policy);

      if (policy) {
        this.updateState(socketId, {
          policyDetails: policy,
        });
      } else {
        parsedResponse = {
          ...parsedResponse,
          response:
            'The policy number you provided is not found. Can you please provide a valid policy number?',
        };
      }
    }

    if (
      parsedResponse.first_name &&
      parsedResponse.last_name &&
      parsedResponse.postal_code
    ) {
      const policy = await findPolicyByFirstLastAndZipCode(parsedResponse);
      if (policy) {
        this.updateState(socketId, {
          policyDetails: policy,
        });
      } else {
        parsedResponse = {
          ...parsedResponse,
          response:
            'The details you provided are not found. Can you please provide a valid first name, last name and postal code?',
        };
      }
    }

    // Handle intent determination
    console.log('parsedResponse>>', parsedResponse);

    if (parsedResponse.intent) {
      if (parsedResponse.intent === 'new_claim') {
        this.updateState(socketId, {
          currentStep: 'NEW_CLAIM',
          intent: 'new_claim',
          isStepChanged: true,
        });
        return {
          message: parsedResponse.response,
        };
      } else if (
        parsedResponse.intent === 'enquiry' &&
        parsedResponse.claim_number
      ) {
        const claimInfo = await findClaimByClaimNumber(
          parsedResponse.claim_number,
        );
        if (claimInfo) {
          this.updateState(socketId, {
            currentStep: 'ENQUIRY',
            claimDetails: claimInfo,
            intent: 'enquiry',
            isStepChanged: true,
          });
        } else {
          parsedResponse = {
            ...parsedResponse,
            response:
              'The claim number you provided is not found. Can you please provide a valid claim number?',
          };
        }
      }
    }

    return {
      message: parsedResponse?.response
        ? parsedResponse?.response
        : parsedResponse,
    };
  }

  async handleNewClaimConversation(socketId, message, base64Data) {
    const state = this.getState(socketId);
    const history = this.getConversationHistory(socketId);

    if (state.isStepChanged == true) {
      const NEW_CLAIM_PROMPT = `You are an auto-insurance claim assistant. You have the following details of the vehicles registered under their policy: ${JSON.stringify(state.policyDetails)}. Your task is to guide users file the first notice of loss claims by asking the following questions one at a time and detect the intent of the user. 
      The intents can be one of the following : 
       - RESTART : When the intention of the user is to restart the conversation or change the policy number or to inquire about an existing claim or file a new claim.
       - NEXT : When user answers the question and want to proceed.
      The questions are as follows : 
        - Question 1: Enquire about the date on which the incident occurred .
        - Question 2: Enquire about the location of the incident, collect address line, state, city and zipcode
        - Question 3: Enquire about which vehicle from ${JSON.stringify(state.policyDetails?.vehicle)} was involved in the accident , do not object make it bullet points so that user can easily understand.
        - Question 4: If vehicle is not present in ${JSON.stringify(state.policyDetails?.vehicle)}, enquire about vehicle details such License Plate, VIN, Year, Make and Model
        - Question 5: Enquire about the cause of loss, was it due to Animal impact, wind, hail, fire or something?
        - Question 6: Enquire about details of the vehicle damage
        - Question 7 : Ask if the user can upload any pictures associated with the damage. Response should contain is_image_upload as true for this question and false for every other question.
          Example response : 
            {
              "intent": "NEXT",
              "is_image_upload": true,
              "is_submitted": false,
              "response": "Can you upload any pictures associated with the damage?"
            }
        - Once you have all the above inputs, finally ask the user if they like to proceed to submit the claim
        - If user agrees to proceed with above data then the value for is_submitted in the response should be true and false for every other scenario.
          Example response : 
            {
              "intent": "NEXT",
              "is_image_upload": false,
              "is_submitted": true,
              "response": "Your claim has been submitted. Can I assist you with anything else?"
            }


        **Important**
        # Try to detect the intent of the user at every step and update the field : intent
        # Do not go to next question once current question is not answered.
        # Do not mention the index of question.
        # If the conversation is over then ask if you can assist the user with anything else and try to detect the intent.
        
        **Response : **
        In your response include only the following keys :
        1. intent
        2. is_image_upload
        3. is_submitted
        4. response
        Response should strictly be in JSON format.

        Example response : 
            {
              "intent": "NEXT",
              "is_image_upload": false,
              "is_submitted": false,
              "response": "Please provide the date on which the incident occurred."
            }
        `;
      history.push({role: 'system', content: NEW_CLAIM_PROMPT});
      this.updateState(socketId, {
        isStepChanged: false,
      });
    }

    if (base64Data) {
      // Create a unique filename for the image
      // Define the directory to save the images
      const filePath = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, {recursive: true});
      }
      try {
        // Remove the base64 header part (e.g., "data:image/png;base64,")
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        // Decode the base64 image data into a buffer
        const imageBuffer = Buffer.from(base64Image, 'base64');
        // Generate a unique filename for the image
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const fileName = `image-${uniqueSuffix}.png`;
        const outputFilePath = path.join(filePath, fileName);
        // Use sharp to compress and save the image
        await sharp(imageBuffer)
          .resize(800) // Optional: Resize the image (you can set the width, height, or keep the aspect ratio)
          .toFormat('png') // Optional: Set the image format (e.g., PNG)
          .toFile(outputFilePath); // Save the image to the filesystem

        history.push({
          role: 'user',
          content: `Uploaded file url is ${fileName}`,
        });

        const response = await this.client.invoke(history);

        history.push({
          role: 'assistant',
          content: response.content.trim(),
        });

        const parsedResponse = this.parseResponse(response.content.trim());

        return {
          message: parsedResponse.response,
          requestImage: false,
        };
      } catch (error) {
        console.log(
          '>>> ~ ChatService ~ handleNewClaimConversation ~ error:',
          error,
        );
        // throw new Error('Error compressing or saving the image: ' + error.message);
        return {
          message: 'An error occurred while processing your image.',
          error: true,
          requestedImage: false,
        };
      }
    }

    history.push({role: 'user', content: message});

    const response = await this.client.invoke(history);

    const responseContent = this.parseResponse(response.content.trim());

    console.log('Response >>', responseContent);

    //this.updateState(socketId, {newClaimStep: state.newClaimStep + 1});
    if (responseContent.is_image_upload == true) {
      history.push({
        role: 'assistant',
        content: response.content.trim(),
      });
      return {
        message: responseContent.response,
        requestImage: true,
      };
    }
    if (responseContent.intent == 'RESTART') {
      console.log('Intent restart');
      this.updateState(socketId, {
        currentStep: 'INITIAL',
        intent: null,
        isStepChanged: true,
      });
      return this.processMessage(socketId, message, null);
    } else if (responseContent.is_submitted == true) {
      history.push({role: 'system', content: EXTRACT_PROMPT});

      const extractResponse = await this.client.invoke(history);

      const claimData = this.parseResponse(extractResponse.content.trim());

      console.log('claimData:', claimData);

      const claimNumber = 'CLM' + moment().valueOf();

      await createClaim({
        ...claimData,
        claimNumber,
        policyNumber: state.policyDetails.policyNumber,
      });

      await createConversation({
        policyNumber: state.policyDetails.policyNumber,
        sessionId: socketId,
        conversationRaw: JSON.stringify(history),
      });

      const claimInfo = await findClaimByClaimNumber(claimNumber);

      this.updateState(socketId, {
        claimDetails: claimInfo,
        currentStep: 'ENQUIRY',
        intent: 'enquiry',
        isStepChanged: true,
      });

      const assistantMessage = `Claim created successfully. Your claim number is ${claimNumber}. May I assist you with anything else ?`;

      history.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return {
        message: assistantMessage,
      };
    } else {
      history.push({
        role: 'assistant',
        content: response.content.trim(),
      });
      return {
        message: responseContent.response,
        requestImage: false,
      };
    }
  }

  async handleInquiryConversation(socketId, message) {
    const state = this.getState(socketId);
    const history = this.getConversationHistory(socketId);

    if (state.isStepChanged == true) {
      const INQUIRY_PROMPT = `You are an auto-insurance claim assistant. You have the following information about the user's claim : ${JSON.stringify(state.claimDetails)}. The user has come to inquire about an existing claim filed by them. Using ONLY the information provided to you about the user's claim, answer the user's query. With each conversation, detect the intent of the user. 
      The intents can be one of the following : 
       - RESTART : When the intention of the user is to restart the conversation or change the policy number or inquire about a different claim number or file a new claim.
       - NEXT : When user answers the question and want to proceed.
      
      **Important**
      # If the conversation is over then ask if you can assist the user with anything else and try detecting the intent of the user.    

      **Response : **
        In your response must include only the following keys :
        1. intent
        2. response
        Response should strictly be in JSON format.

        Example response : 
            {
              "intent": "NEXT",
              "response": "What do you want to know about this claim."
            }
      `;
      history.push({role: 'system', content: INQUIRY_PROMPT});
      this.updateState(socketId, {
        isStepChanged: false,
      });
    }

    history.push({role: 'user', content: message});

    const response = await this.client.invoke(history);

    console.log('Inquiry >>', response.content);

    const parsedContent = this.parseResponse(response.content);

    history.push({
      role: 'assistant',
      content: response.content,
    });

    if (parsedContent.intent == 'RESTART') {
      this.updateState(socketId, {
        currentStep: 'INITIAL',
        intent: null,
        isStepChanged: true,
      });
      return this.processMessage(socketId, message, null);
    } else {
      return {message: parsedContent.response};
    }
  }

  getConversationHistory(socketId) {
    return this.conversationHistories.get(socketId) || [];
  }
}

module.exports = ChatService;
