const {createServer} = require('http');
const {env, mongoose, app} = require('./config');
const ChatService = require('./services/chatService');
const {LOG_LEVELS} = require('./utils/constants');
const multer = require('multer');

const server = createServer(app);
const io = require('socket.io')(server, {
  cors: {origin: '*'},
  path: '/api/',
});

const openaiConfig = {
  // endpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
  // apiKey: process.env.AZURE_OPENAI_API_KEY,
  // apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  // deployment: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_API_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  // azureOpenAIApiInstanceName: 'chat',
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
};

io.on('connection', socket => {
  const chatService = new ChatService(openaiConfig);
  console.log('New client connected', LOG_LEVELS.INFO);

  // Initialize conversation and send welcome message
  chatService.initializeConversation(socket.id).then(message => {
    // socket.emit('message', { message });
  });

  // Single event handler for all messages
  socket.on('message', async ({text}) => {
    try {
      const response = await chatService.processMessage(socket.id, text);
      socket.emit('message', response);
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('message', {
        message: 'An error occurred while processing your request.',
        error: true,
      });
    }
  });

  // Handle image uploads
  // socket.on('image', async ({image}) => {
  //   // console.log(">>> ~ socket.on ~ image:", image)
  //   try {
  //     // const response = await chatService.processMessage(socket.id, image);
  //     // socket.emit('message', response);
  //     const response = await chatService.processMessage(socket.id, null, image);
  //     socket.emit('message', response);
  //   } catch (error) {
  //     console.error('Error processing message:', error);
  //     socket.emit('message', {
  //       message: 'An error occurred while processing your request.',
  //       error: true,
  //     });
  //   }
  // });

  // Store chunks temporarily for each socket connection
  const imageChunks = {};

  // Handle image uploads
  socket.on('image', async ({image, isChunk, isLastChunk}) => {
    try {
      if (isChunk) {
        // Initialize an array for storing chunks if it doesn't exist
        if (!imageChunks[socket.id]) {
          imageChunks[socket.id] = [];
        }
        // Add the chunk to the array
        imageChunks[socket.id].push(image);

        // If it's the last chunk, combine all chunks and process the image
        if (isLastChunk) {
          const fullImage = imageChunks[socket.id].join(''); // Combine all chunks
          delete imageChunks[socket.id]; // Clean up chunks for the socket

          const response = await chatService.processMessage(
            socket.id,
            null,
            fullImage,
          );
          socket.emit('message', response);
        }
      } else {
        // If it's not chunked, process directly
        const response = await chatService.processMessage(
          socket.id,
          null,
          image,
        );
        socket.emit('message', response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('message', {
        message: 'An error occurred while processing your request.',
        error: true,
      });
    }
  });

  socket.on('disconnect', () => {
    chatService.conversationHistories.delete(socket.id);
    chatService.flowState.delete(socket.id);
    console.log('Client disconnected', LOG_LEVELS.INFO);

    delete imageChunks[socket.id];
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
