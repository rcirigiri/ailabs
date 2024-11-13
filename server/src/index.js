const {createServer} = require('http');
const {env, mongoose, app} = require('./config');
const ChatService = require('./services/chatService');
const { LOG_LEVELS } = require('./utils/constants');

const server = createServer(app);
const io = require('socket.io')(server, {
  cors: {origin: '*'},
});

const openaiConfig = {
  endpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
};


io.on('connection', socket => {
  console.log('New client connected', LOG_LEVELS.INFO);
  
  const chatService = new ChatService(openaiConfig);
  chatService.initializeConversation(socket.id);

  socket.on('chat message', async ({text}) => {
    await chatService.handleChat(socket, text);
  });

  socket.on('disconnect', () => {
    chatService.conversationHistories.delete(socket.id);
    console.log('Client disconnected', LOG_LEVELS.INFO);
  });
});

mongoose
  .connect(env.mongoUri)
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
