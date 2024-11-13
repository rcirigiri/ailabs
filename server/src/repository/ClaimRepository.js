const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const {Policy, PolicyDetails, Mongoose, Claim} = require('../models');
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
  createClaim: async data => {
    return await Insert({
      model: Claim,
      data,
    });
  },
  findClaimByClaimNumber: async claimNumber => {
    return await FindOne({
      model: Claim,
      where: {claimNumber: claimNumber},
    });
  },
};
