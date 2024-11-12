const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const {
  User,
  Role,
  Organisation,
  Policy,
  PolicyDetails,
  Mongoose,
} = require('../models');
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
  createPolicy: async data => {
    return await Insert({
      model: Policy,
      data,
    });
  },
  findPolicyByPolicyId: async id => {
    return await FindOne({
      model: Policy,
      where: {
        policyNumber: id,
      },
    });
  },
};
