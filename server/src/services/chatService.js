const {AzureOpenAI} = require('openai');
const {
  findPolicyByPolicyId,
  findClaimByClaimNumber,
  createClaim,
} = require('../repository');
const {LOG_LEVELS} = require('../utils/constants');

class ChatService {
  constructor(config) {
    this.client = new AzureOpenAI(config);
    this.conversationHistories = new Map();
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
  }

  getConversationHistory(socketId) {
    if (!this.conversationHistories.has(socketId)) {
      this.initializeConversation(socketId);
    }
    return this.conversationHistories.get(socketId);
  }

  addToConversationHistory(socketId, role, content) {
    const history = this.getConversationHistory(socketId);
    history.push({role, content});
  }

  async handleChat(socket, text) {
    try {
      this.addToConversationHistory(socket.id, 'user', text);
      console.log('[USER MESSAGE] =>', text, LOG_LEVELS.DEBUG);

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
        await this.handleIntent(socket, responseJson);
      } else {
        socket.emit('response', {
          message: responseJson?.response,
          isComplete: true,
        });
      }

      this.addToConversationHistory(socket.id, 'assistant', fullResponse);
    } catch (error) {
      console.error('Error processing message:', error, LOG_LEVELS.ERROR);
      socket.emit('response', {
        message: 'An error occurred while processing your request.',
        isComplete: true,
        isError: true,
      });
    }
  }

  async handleIntent(socket, responseJson) {
    if (responseJson.intent === 'inquiry') {
      if (responseJson.claim_number) {
        const claim = await findClaimByClaimNumber(responseJson.claim_number);
        if (claim) {
          const INQUIRY_PROMPT = `You are an auto-insurance claim assistant. You have the following information about the user's claim: ${JSON.stringify(claim)}. The user has come to inquire about an existing claim filed by them. Using ONLY the information provided to you about the user's claim, answer the user's query.`;
          this.addToConversationHistory(socket.id, 'system', INQUIRY_PROMPT);
        } else {
          socket.emit('response', {
            message: 'No claim found with the provided claim number.',
            isComplete: true,
          });
        }
      }
    } else if (responseJson.intent === 'new_claim') {
      const policy = await findPolicyByPolicyId(responseJson.policy_number);
      if (policy) {
        const NEW_CLAIM_PROMPT = `You are an auto-insurance claim assistant. You have the following details of the vehicles registered under their policy: ${JSON.stringify(policy)}. Your task is to guide users file the first notice of loss claims by asking the following questions
        # Question 1 : Enquire about the date on which the incident occurred
        # Question 2 : Enquire about the location of the incident, collect address line , state , city and zipcode
        # Question 3 : Enquire about which vehicle from ${JSON.stringify(policy.vehicle)} was involved in the accident
        # Question 4 : If vehicle is not present in ${JSON.stringify(policy.vehicle)}, enquire about vehicle details such License Plate, VIN, Year ,Make and Model
        # Question 5 : Enquire about the cause of loss, was it due to Animal impact , wind , hail , fire or something?
        # Question 6 : Enquire about details of the vehicle damage
        # Question 7 : Ask if the user can upload any pictures associated with the damage
        # Question 8 : Once you have all the above inputs, finally ask the user if they like to proceed to submit the claim`;
        this.addToConversationHistory(socket.id, 'system', NEW_CLAIM_PROMPT);
      } else {
        socket.emit('response', {
          message: 'No policy found with the provided policy number.',
          isComplete: true,
        });
      }
    }
  }
}

module.exports = ChatService;
