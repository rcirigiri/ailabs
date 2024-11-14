const {AzureOpenAI} = require('openai');
const moment = require('moment');
const {
  findPolicyByPolicyId,
  findClaimByClaimNumber,
  createClaim,
  createConversation,
  findPolicyByFirstLastAndZipCode,
} = require('../repository');
const {LOG_LEVELS} = require('../utils/constants');

class ChatService {
  constructor(config) {
    this.client = new AzureOpenAI(config);
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
      newClaimStep: 0,
    });
  }

  getState(socketId) {
    return this.flowState.get(socketId);
  }

  updateState(socketId, updates) {
    const currentState = this.getState(socketId);
    this.flowState.set(socketId, {...currentState, ...updates});
  }

  async initializeConversation(socketId) {
    this.initializeState(socketId);
    const INITIAL_CMD = `You are an auto-insurance claim assistant. Your task is to guide users to file the first notice of loss claims or enquire about previous claims by following these steps -
# Step 1 : Enquire about the policy number , If policy number is not available, ask for first name , last name and postal code.
# Only proceed with the next step once you have information about policy number or (first name , last name and postal code). Else keep requesting either Policy number or (first name , last name and postal code) from the user.
# Step 3 : Ask and Understand the intent of the user, the intent can either be inquiry or new_claim.
# Only proceed with the next step once you have information about policy number or (first name , last name and postal code) and intent. Else keep requesting information about the missing entity.
# Step 4 : If the user's intent is inquiry, ask them to provide the claim number. Else, if their intent is new claim filing, thank them for sharing their details and let that know that we will begin the process by asking a set of questions, do not ask any more questions.
# Step 5 : If user intent was inquiry and they have still not provided claim number, continue requesting the same. Else if, their intent was inquiry and they have provided the claim number, thank them and ask them to ask their query now. Else, skip this step.
In your response include only the following keys and the entities extracted for these fields
1. policy_number
2. first_name, last_name and postal_code
3. intent
4. claim_number
5. response`;

    this.conversationHistories.set(socketId, [
      {role: 'system', content: INITIAL_CMD},
    ]);
  }

  async processMessage(socketId, message) {
    try {
      const state = this.getState(socketId);
      let response;

      if (state.currentStep === 'INITIAL') {
        response = await this.handleInitialConversation(socketId, message);
      } else if (state.currentStep === 'NEW_CLAIM') {
        response = await this.handleNewClaimConversation(socketId, message);
      } else if (state.currentStep === 'INQUIRY') {
        response = await this.handleInquiryConversation(socketId, message);
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
    const history = this.getConversationHistory(socketId);
    history.push({role: 'user', content: message});

    const response = await this.client.chat.completions.create({
      messages: history,
      model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    });
    let parsedResponse = {};
    try {
      console.log('TRY');
      console.log('response.choices[0].message.content',response.choices[0].message.content);
      
      parsedResponse = JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.log('TRY1111111111111');

      parsedResponse = response.choices[0].message.content;
    }
    history.push({
      role: 'assistant',
      content: response.choices[0].message.content,
    });
    console.log(`[ASSISTANT]`, parsedResponse);
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
    if (parsedResponse.intent) {
      if (parsedResponse.intent === 'new_claim') {
        this.updateState(socketId, {
          currentStep: 'NEW_CLAIM',
          intent: 'new_claim',
        });
      } else if (
        parsedResponse.intent === 'inquiry' &&
        parsedResponse.claim_number
      ) {
        const claimInfo = await findClaimByClaimNumber(
          parsedResponse.claim_number,
        );
        if (claimInfo) {
          this.updateState(socketId, {
            currentStep: 'INQUIRY',
            claimDetails: claimInfo,
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
    console.log(
      parsedResponse?.response
        ? JSON.stringify(parsedResponse) + 'sssssssssssssssss'
        : parsedResponse,
    );

    return {
      message: parsedResponse?.response
        ? parsedResponse?.response
        : parsedResponse,
    };
  }

  async handleNewClaimConversation(socketId, message) {
    const state = this.getState(socketId);
    const history = this.getConversationHistory(socketId);

    if (state.newClaimStep === 0) {
      const NEW_CLAIM_PROMPT = `You are an auto-insurance claim assistant. You have the following details of the vehicles registered under their policy: ${JSON.stringify(state.policyDetails)}. Your task is to guide users file the first notice of loss claims by asking the following questions one at a time:
        - Question 1: Enquire about the date on which the incident occurred .
        - Question 2: Enquire about the location of the incident, collect address line, state, city and zipcode
        - Question 3: Enquire about which vehicle from ${JSON.stringify(state.policyDetails.vehicle)} was involved in the accident , do not object make it bullet points so that user can easily understand.
        - Question 4: If vehicle is not present in ${JSON.stringify(state.policyDetails.vehicle)}, enquire about vehicle details such License Plate, VIN, Year, Make and Model
        - Question 5: Enquire about the cause of loss, was it due to Animal impact, wind, hail, fire or something?
        - Question 6: Enquire about details of the vehicle damage
        - Question 7: Once you have all the above inputs, finally ask the user if they like to proceed to submit the claim
        - If user agrees to proceed with above data then return a response with just a string "SUBMITTED" and nothing else.`;

      history.push({role: 'system', content: NEW_CLAIM_PROMPT});
      this.updateState(socketId, {newClaimStep: 1});
    }

    history.push({role: 'user', content: message});

    const response = await this.client.chat.completions.create({
      messages: history,
      model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    });

    const responseContent = response.choices[0].message.content;
    history.push({role: 'assistant', content: responseContent});

    if (responseContent.trim() === 'SUBMITTED') {
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

      history.push({role: 'system', content: EXTRACT_PROMPT});

      const extractResponse = await this.client.chat.completions.create({
        messages: history,
        model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      });

      const claimData = JSON.parse(extractResponse.choices[0].message.content);
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

      return {
        message: `Claim created successfully. Your claim number is ${claimNumber}`,
        complete: true,
      };
    }

    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      if (parsedResponse) return {message: parsedResponse.response};
    } catch (error) {
      return {message: response.choices[0].message.content};
    }

    // return {message: responseContent};
  }

  async handleInquiryConversation(socketId, message) {
    const state = this.getState(socketId);
    const history = this.getConversationHistory(socketId);

    const inquiry_prompt = `You are an auto-insurance claim assistant. You have the following information about the user's claim : ${JSON.stringify(state.claimDetails)}. The user has come to inquire about an existing claim filed by them. Using ONLY the information provided to you about the user's claim, answer the user's query.`;

    history.push({role: 'system', content: inquiry_prompt});
    history.push({role: 'user', content: message});

    const response = await this.client.chat.completions.create({
      messages: history,
      model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    });

    history.push({
      role: 'assistant',
      content: response.choices[0].message.content,
    });
    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      if (parsedResponse) return {message: parsedResponse.response};
    } catch (error) {
      return {message: response.choices[0].message.content};
    }
  }

  getConversationHistory(socketId) {
    return this.conversationHistories.get(socketId) || [];
  }
}

module.exports = ChatService;
