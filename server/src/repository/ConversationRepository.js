const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const {Conversation, Policy, PolicyDetails, Mongoose} = require('../models');
const {
  Count,
  IsExists,
  Insert,
  FindOne,
  Find,
  CompressImageAndUpload,
  FindAndUpdate,
  Delete,
  Aggregate,
  ValidateEmail,
  PasswordStrength,
  ValidateAlphanumeric,
  ValidateLength,
  ValidateMobile,
  GeneratePassword,
  IsExistsOne,
  UpdateMany,
} = require('../controllers/baseController');
const {
  Handle500Error,
  Handle200Response,
  Handle400Error,
} = require('../helpers');

module.exports = {
  createConversation: async data => {
    return await Insert({
      model: Conversation,
      data,
    });
  },
};
