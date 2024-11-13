const {AzureOpenAI} = require('openai');
const moment = require('moment');
const {
  findPolicyByPolicyId,
  findClaimByClaimNumber,
  createClaim,
  createConversation,
} = require('../repository');
const {LOG_LEVELS} = require('../utils/constants');

class ChatService {
  constructor(config) {
    this.client = new AzureOpenAI(config);
    this.conversationHistories = new Map();
    this.policyDetails = null;
    this.conversationState = 'INITIAL';
    this.userIntent = null;
    this.initialStep = true;
    this.userResponse = null;
    this.claimNumber = null;
  }

  initializeConversation(socketId) {
    const INITIAL_CMD = `You are an auto-insurance claim assistant. Your task is to guide users to file the first notice of loss claims or enquire about previous claims by following these steps -
# Step 1 : Enquire about the policy number , If policy number is not available, ask for first name , last name and postal code. 
# Only proceed with the next step once you have information about policy number or (first name , last name and postal code). Else keep requesting either Policy number or (first name , last name and postal code) from the user.
# Step 3 : Ask and Understand the intent of the user, the intent can either be inquiry or new_claim.
# Only proceed with the next step once you have information about policy number or (first name , last name and postal code) and intent. Else keep requesting information about the missing entity. 
# Step 4 : If the user's intent is inquiry, ask them to provide the claim number. Else, if their intent is new claim filing, thank them for sharing their details and let that know that we will begin the process by asking a set of questions, do not ask any more questions.
# Step 5 : If user intent was inquiry and they have still not provided claim number, continue requesting the same. Else if, their intent was inquiry and they have provided the claim number, thank them and ask them to ask their query now. Else, skip this step.
In your response include only the following keys and the entities extracted for these fields -

1. policy_number 

2. first_name, last_name and postal_code

3. intent

4. claim_number

5. response

##### EXAMPLE RESPONSE ######

1. {"policy_number" : "123KKL12", "first_name" : "", "last_name" : "", "postal_code" : "","intent" : "new_claim", "claim_number" : "","response" : "Thank you for sharing. We will now proceed with filing a new claim. To achieve this I will ask you a set of questions."}

2. { "policy_number" : "", "first_name" : "John", "last_name" : "Doe", "postal_code" : "", "intent" : "inquiry", "claim_number" : "","response" : "Thank you for sharing your first name and last name, I also require your postal code"}

3. { "policy_number" : "", "first_name" : "", "last_name" : "", "postal_code" : "", "intent" : "", "claim_number" : "","response" : "Can you please share details about your policy number or your first name, last name and postal code to continue with the process."}

4. { "policy_number" : "123KKL12", "first_name" : "", "last_name" : "", "postal_code" : "", "intent" : "", "claim_number" : "","response" : "Thank you for your details. Are you looking to inquire about an existing claim or are you filing a new claim?"}

5. { "policy_number" : "123KKL12", "first_name" : "", "last_name" : "", "postal_code" : "", "intent" : "inquiry", "claim_number" : "", "response" : "Thank you for your details. Can you please share your claim number?"}

6. { "policy_number" : "123KKL12", "first_name" : "", "last_name" : "", "postal_code" : "", "intent" : "inquiry", "claim_number" : "58661233", "response" : "Thank you for your details. Please ask me your query"}

`;
    this.conversationHistories.set(socketId, [
      {role: 'system', content: INITIAL_CMD},
    ]);
    this.initialStep = false;
  }

  getConversationHistory(socketId) {
    if (!this.conversationHistories.has(socketId)) {
      this.initializeConversation(socketId);
    }
    // console.log(
    //   'Conversation history ',
    //   this.conversationHistories.get(socketId),
    // );
    return this.conversationHistories.get(socketId);
  }

  addToConversationHistory(socketId, role, content) {
    const history = this.getConversationHistory(socketId);
    history.push({role, content});
  }

  async makeModelCall(messages) {
    return await this.client.chat.completions.create({
      messages,
      model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      stream: false,
    });
  }

  parseModelResponse(fullResponse) {
    try {
      return JSON.parse(fullResponse);
    } catch (err) {
      // console.error('Error parsing response:', err, LOG_LEVELS.ERROR);
      return null;
    }
  }

  async handelEnquire(socket) {
    if (!this.policyDetails) {
      socket.emit('response', {
        message: 'No policy found with the provided policy number.',
      });
      return;
    }
    console.log('SSSSSSSSSSSSSSSSS', this.policyDetails, this.userResponse);
    if (!this.userResponse?.claim_number) {
      this.addToConversationHistory(
        socket.id,
        'assistant',
        'Invalid claim number, Please enter a valid number',
      );
      this.handleChat(
        socket.id,
        'Invalid claim number, Please enter a valid number',
      );
      // socket.emit('response', {
      //   message: 'Invalid claim number, Please enter a valid number',
      // });
    }
    this.claimNumber = this.userResponse?.claim_number;

    const claimInfo = await findClaimByClaimNumber(this.claimNumber);
    if (!claimInfo) {
      this.addToConversationHistory(
        socket.id,
        'assistant',
        'Claim number not found in our system. Please try again',
      );
      this.handleChat(
        socket.id,
        'Claim number not found in our system. Please try again',
      );
      return;
    }

    const inquiry_prompt = `You are an auto-insurance claim assistant. You have the following information about the user's claim : ${JSON.stringify(claimInfo)}. The user has come to inquire about an existing claim filed by them. Using ONLY the information provided to you about the user's claim, answer the user's query.`;
    console.log('inquiry_prompt------', inquiry_prompt, socket.id);

    this.addToConversationHistory(socket.id, 'system', inquiry_prompt);
    this.addToConversationHistory(
      socket.id,
      'assistant',
      'how can i help you for this claim?',
    );
    socket.emit('response', {
      message: 'how can i help you for this claim?',
    });

    const messages = this.getConversationHistory(socket.id);
    const response = await this.makeModelCall(messages);

    if (!response?.choices?.[0]?.message?.content) {
      socket.emit('response', {
        message: 'Failed to process response.',
        isComplete: true,
      });
      return;
    }

    const fullResponse = response.choices[0].message.content;
    this.addToConversationHistory(socket.id, 'assistant', fullResponse);

    socket.emit('response', {
      message: fullResponse,
      isComplete: true,
    });
  }

  async handleChat(socket, text) {
    try {
      this.addToConversationHistory(socket.id, 'user', text);
      console.log('[USER MESSAGE] =>', text, LOG_LEVELS.DEBUG);

      /**
       * Handle the conversation based on it's state ENUM(INITIAL,ENQUIRY,NEWCLAIM)
       */

      switch (this.conversationState) {
        case 'ENQUIRY':
          console.log('[ENQUIRY]', LOG_LEVELS.DEBUG);
          this.handelEnquire(socket);
          break;
        case 'NEWCLAIM':
          console.log('[NEWCLAIM]', LOG_LEVELS.DEBUG);
          this.handleNewClaimConversation(socket);
          break;
        default:
          console.log('[DEFAULT]', LOG_LEVELS.DEBUG);
          this.handleInitialConversation(socket);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error, LOG_LEVELS.ERROR);
      socket.emit('response', {
        message: 'An error occurred while processing your request.',
        isComplete: true,
        isError: true,
      });
    }
  }

  async handleInitialConversation(socket) {
    const messages = this.getConversationHistory(socket.id);

    const response = await this.client.chat.completions.create({
      messages,
      model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      stream: false,
    });

    const fullResponse = response.choices[0].message?.content;
    let responseJson;

    try {
      responseJson = JSON.parse(fullResponse);
    } catch (err) {
      responseJson = null;
    }

    console.log('[ASSISTANT RESPONSE] =>', responseJson, LOG_LEVELS.DEBUG);

    if (responseJson?.intent) {
      console.log(
        '-------------------------------------',
        responseJson?.intent,
      );

      this.userIntent = responseJson?.intent;
    }

    if (responseJson) {
      this.userResponse = responseJson;
    }
    if (this.userIntent) {
      // Found the intent, proceed to next conversation state based on intent
      if (this.userIntent == 'new_claim' && this.initialStep) {
        this.conversationState = 'NEWCLAIM';
        this.initialStep = true;
        this.addToConversationHistory(socket.id, 'assistant', fullResponse);

        // Call chat handler to initiate new conversation state and response message
        // socket.emit('response', {
        //   message: responseJson?.response,
        //   isComplete: true,
        // });
        this.addToConversationHistory(socket.id, 'user', 'sure, go ahead.');
        this.handleChat(socket, 'sure, go ahead.');
      }
      console.log(
        'responseJson?.claim_number&&&&&&&&&&&&&&&&&&&&&&&&&&&&&',
        responseJson?.claim_number,
        this.userIntent,
      );

      if (this.userIntent == 'inquiry' && responseJson?.claim_number) {
        this.conversationState = 'ENQUIRY';
        this.claimNumber = responseJson?.claim_number;
        this.addToConversationHistory(socket.id, 'assistant', fullResponse);
        const claimInfo = await findClaimByClaimNumber(
          responseJson?.claim_number,
        );
        if (!claimInfo) {
          responseJson.response =
            'The claim number you provided is not found. Please provide a valid claim number.';
          this.addToConversationHistory(socket.id, 'assistant', fullResponse);
          socket.emit('response', {
            message: responseJson?.response,
            isComplete: true,
          });
        }

        const inquiry_prompt = `You are an auto-insurance claim assistant. You have the following information about the user's claim : ${JSON.stringify(claimInfo)}. The user has come to inquire about an existing claim filed by them. Using ONLY the information provided to you about the user's claim, answer the user's query.`;
        console.log('inquiry_prompt------', inquiry_prompt, socket.id);

        this.addToConversationHistory(socket.id, 'system', inquiry_prompt);

        const messages = this.getConversationHistory(socket.id);
        const res = await this.makeModelCall(messages);

        socket.emit('response', {
          message: res.choices[0].message.content,
          isComplete: true,
        });
      } else {
        this.addToConversationHistory(socket.id, 'assistant', fullResponse);
        socket.emit('response', {
          message: responseJson?.response,
          isComplete: true,
        });
      }
      // Adding conversation inside if block to avoid index disrupt of array
    } else {
      const policyDetails = await findPolicyByPolicyId(
        responseJson?.policy_number,
      );

      if (policyDetails) {
        this.policyDetails = policyDetails;
      } else if (
        responseJson?.policy_number ||
        (responseJson?.first_name &&
          responseJson?.last_name &&
          responseJson?.postal_code)
      ) {
        responseJson.response =
          'The details you provided is not found. Can you please share details about your policy number or your first name, last name and postal code to continue with the process.';
      }
      this.addToConversationHistory(socket.id, 'assistant', fullResponse);
      socket.emit('response', {
        message: responseJson?.response,
        isComplete: true,
      });
    }
  }
  async createNewClaim(socket) {
    const EXTRACT_PROMPT = `You are a highly accurate entity extraction assistant. Your role is to analyze the conversation between an insurance claims agent and the user and extract the following relevant entities. If you are unable to find entities for a specific field, leave them empty. Return your response as JSON with the following fields only, do not respond with any other text.

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
    }`;

    if (this.initialStep) {
      this.addToConversationHistory(socket.id, 'system', EXTRACT_PROMPT);
      this.initialStep = false;
    }

    const messages = this.getConversationHistory(socket.id);
    const response = await this.makeModelCall(messages);

    if (!response?.choices?.[0]?.message?.content) {
      socket.emit('response', {
        message: 'Failed to process claim data.',
        isComplete: true,
      });
      return;
    }

    const fullResponse = response.choices[0].message.content;
    this.addToConversationHistory(socket.id, 'assistant', fullResponse);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(fullResponse);
    } catch (err) {
      console.error('Failed to parse response:', err);
      socket.emit('response', {
        message: 'Failed to process claim data.',
        isComplete: true,
      });
      return;
    }

    if (!parsedResponse) {
      socket.emit('response', {
        message: 'Failed to extract claim data.',
        isComplete: true,
      });
      return;
    }

    const claimNumber = 'CLM' + moment().valueOf();
    const finalData = {
      ...parsedResponse,
      claimNumber,
      policyNumber:
        this.policyDetails?.policyNumber || parsedResponse.policyNumber,
    };

    try {
      await createClaim(finalData);
      await createConversation({
        policyNumber: finalData.policyNumber,
        sessionId: socket.id,
        conversationRaw: JSON.stringify(messages),
      });

      socket.emit('response', {
        message: `Claim created successfully. Your claim number is ${claimNumber}`,
        isComplete: true,
      });
    } catch (error) {
      console.error('Error saving claim:', error);
      socket.emit('response', {
        message: 'Failed to save claim data.',
        isComplete: true,
      });
    }
  }

  async handleNewClaimConversation(socket) {
    const policy = this.policyDetails;
    if (!policy) {
      socket.emit('response', {
        message: 'No policy found with the provided policy number.',
        isComplete: true,
      });
      return;
    }

    if (this.initialStep) {
      const NEW_CLAIM_PROMPT = `You are an auto-insurance claim assistant. You have the following details of the vehicles registered under their policy: ${JSON.stringify(policy)}. Your task is to guide users file the first notice of loss claims by asking the following questions one at a time:
        - Question 1: Enquire about the date on which the incident occurred
        - Question 2: Enquire about the location of the incident, collect address line, state, city and zipcode
        - Question 3: Enquire about which vehicle from ${JSON.stringify(policy.vehicle)} was involved in the accident
        - Question 4: If vehicle is not present in ${JSON.stringify(policy.vehicle)}, enquire about vehicle details such License Plate, VIN, Year, Make and Model
        - Question 5: Enquire about the cause of loss, was it due to Animal impact, wind, hail, fire or something?
        - Question 6: Enquire about details of the vehicle damage
        - Question 7: Once you have all the above inputs, finally ask the user if they like to proceed to submit the claim
        - If user agrees to proceed with above data then return a response with just a string "SUBMITTED" and nothing else.`;

      this.addToConversationHistory(socket.id, 'system', NEW_CLAIM_PROMPT);
      this.initialStep = false;
    }

    const messages = this.getConversationHistory(socket.id);
    const response = await this.makeModelCall(messages);

    if (!response?.choices?.[0]?.message?.content) {
      socket.emit('response', {
        message: 'Failed to process response.',
        isComplete: true,
      });
      return;
    }

    const fullResponse = response.choices[0].message.content;
    this.addToConversationHistory(socket.id, 'assistant', fullResponse);

    if (fullResponse.trim() === 'SUBMITTED') {
      this.initialStep = true;
      await this.createNewClaim(socket);
      return;
    }

    socket.emit('response', {
      message: fullResponse,
      isComplete: true,
    });
  }
}

module.exports = ChatService;
