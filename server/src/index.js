const {env, mongoose, app} = require('./config');
const {
  constants: {LOG_LEVELS},
} = require('./utils');
const {createServer} = require('node:http');
const {AzureOpenAI} = require('openai');
const server = createServer(app);

// Initialize Socket.IO
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

const openaiConfig = {
  endpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
};

const ASSISTANT_ROLE = `
You are an auto-insurance claim assistant. Your role is to guide users to file the first notice of loss claims or inquire about previous claims. Follow these instructions carefully:

1. **Start by Asking for Identification Information**:
   - Ask the user to provide a **policy number**. If they cannot provide it, request their **first name, last name, and postal code** instead.
   - Proceed only once you have either the **policy number** or **first name, last name, and postal code**.
   - Return this data as json like this: {
            first_name:'',
            last_name:'',
            postal_code:'',
            policy_number:'', 
            step:1
   } if there any  empty fields make it empty string.

2. **Determine the User's Intent**:
   - After collecting identification information, ask if they want to **inquire about a previous claim** or **file a new claim**.
   - If they want to inquire, ask for the **claim number** to locate their specific claim.
   - if, their intent was inquiry and they have provided the claim number, thank them and ask them to ask their query now. Else, skip this step.

3. **For a New Claim**:
   - Ask the following questions sequentially to collect all necessary information  If you are unable to find entities for a specific field, leave them empty. Return your response as JSON with the following fields only, do not respond with any other text : 
      1. policy_number
      2. vehicle
      4. first_name
      5. last_name
      6. postal_code
      7. incident_date
      8. loss_location_address_line 
      9. loss_location_state
      10. loss_location_city
      11. loss_location_postal_code
      12. vehicle_license_plate
      13. vehicle_VIN
      14. vehicle_year
      15. vehicle_make
      16. vehicle_model
      17. cause_of_loss
      18. vehicle_damage_details
`;

// You are an auto-insurance claim assistant. Your task is to guide users around the first notice of loss claims by asking the following questions-
// Enquire about the policy number.
// If policy number is not available, ask for first name , last name and postal code. Else, skip this step.
// Enquire about when the date on which the incident occurred.
// Enquire about the location of the incident, collect address line , state , city and zipcode.
// Enquire about which vehicle was involved in the accident.
// Enquire about the cause of loss, was it due to Animal impact , wind , hail , fire or something?.
// Enquire about details of the vehicle damage.
// Ask if the user can upload any pictures associated with the damage.
// Once you have all the above inputs, finally ask the user if they like to proceed to submit the claim.
// Initialize Azure OpenAI client
const client = new AzureOpenAI(openaiConfig);

// Store conversation histories for each user
const conversationHistories = new Map();

// Initialize conversation for new user
const initializeConversation = socketId => {
  conversationHistories.set(socketId, [
    {role: 'system', content: ASSISTANT_ROLE},
  ]);
};

// Get conversation history for a user
const getConversationHistory = socketId => {
  if (!conversationHistories.has(socketId)) {
    initializeConversation(socketId);
  }
  return conversationHistories.get(socketId);
};

// Add message to conversation history
const addToConversationHistory = (socketId, role, content) => {
  const history = getConversationHistory(socketId);
  history.push({role, content});

  // Keep conversation history at a reasonable size (last 20 messages)
  if (history.length > 21) {
    history.splice(1, 1);
  }
};

const handleChat = async (socket, text) => {
  try {
    // Add user message to history
    addToConversationHistory(socket.id, 'user', text);
    console.log('[USER]=>', text, LOG_LEVELS.DEBUG);

    // Get complete conversation history
    const messages = getConversationHistory(socket.id);

    // Send a partial response event to inform the client that the stream is starting
    socket.emit('response', {message: '', isComplete: false});

    const stream = await client.chat.completions.create({
      messages,
      model: openaiConfig.deployment,
      stream: true,
    });

    let fullResponse = '';
    console.log('[CHATGPT]=>', fullResponse, LOG_LEVELS.DEBUG);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        socket.emit('response', {
          message: content,
          isComplete: false,
          isError: false,
        });
      }
    }

    // When the stream ends, send a final event to mark completion
    socket.emit('response', {message: '', isComplete: true});

    // Add the assistant’s full response to the conversation history
    addToConversationHistory(socket.id, 'assistant', fullResponse);
  } catch (error) {
    console.error('Error processing message:', error, LOG_LEVELS.ERROR);
    socket.emit('response', {
      message: JSON.stringify(error),
      isComplete: true,
      isError: true,
    });
  }
};

// Socket.IO connection handling
io.on('connection', socket => {
  console.log('New client connected', LOG_LEVELS.INFO);

  // Initialize conversation history for new connection
  initializeConversation(socket.id);

  // Handle chat messages
  socket.on('chat message', async ({text}) => {
    await handleChat(socket, text);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Clean up chat history when client disconnects
    conversationHistories.delete(socket.id);
    console.log('Client disconnected', LOG_LEVELS.INFO);
  });
});

const origLog = console.log;
console.log = (...args) => {
  let level = LOG_LEVELS.DEBUG;
  if (Object.keys(LOG_LEVELS).includes(args[args.length - 1])) {
    level = args[args.length - 1];
    args.pop();
  }
  origLog(new Date(), ' ', level, '\t : ', ...args);
};

// Connect Mongoose and start server
mongoose
  .connect()
  .then(() => {
    server.listen(env.port, () => {
      console.log(
        `Server started on port ${env.port} (${env.env})`,
        LOG_LEVELS.INFO,
      );
    });
  })
  .catch(e => {
    console.log('Invalid database connection...!', LOG_LEVELS.ERROR);
  });
