const mongoose = require('mongoose');
const ConversationSchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    conversationRaw: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model('conversation', ConversationSchema);
module.exports = Conversation;
