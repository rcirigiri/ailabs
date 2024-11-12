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
  createPolicyDetails: async data => {
    return await Insert({
      model: PolicyDetails,
      data,
    });
  },
  findPolicyDetailsByPolicyID: async policyID => {
    return await FindOne({
      model: PolicyDetails,
      where: {policyNumber: policyID},
    });
  },
  findPolicyDetailsByNameAndPostalCode: async (
    firstName,
    lastName,
    postalCode,
  ) => {
    return await FindOne({
      model: PolicyDetails,
      where: {firstName, lastName, postalCode},
    });
  },
};
