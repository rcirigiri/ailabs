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
} = require('./baseController');
const {
  Handle500Error,
  Handle200Response,
  Handle400Error,
} = require('../helpers');
const {SALT_ROUNDS} = require('../utils/constants');
const {env} = require('../config');
const {
  createPolicy,
  createPolicyDetails,
  findPolicyDetailsByPolicyID,
} = require('../repository');

module.exports = {
  CreateNewPolicy: async (req, res, next) => {
    try {
      const {
        firstName,
        lastName = '',
        policyType,
        policyName,
        vehicleNumber,
        postalCode,
        VIN,
        year,
        make,
        model,
      } = req.body;
      if (!firstName) return Handle400Error(res, 'First Name is required.');
      if (!policyType) {
        return Handle400Error(res, 'Policy Type is required.');
      }
      if (!policyName) {
        return Handle400Error(res, 'Policy Name is required.');
      }
      if (!vehicleNumber) {
        return Handle400Error(res, 'Vehicle Number is required.');
      }
      if (!postalCode) {
        return Handle400Error(res, 'Vehicle Number is required.');
      }
      const policyNumber = moment().valueOf();

      const insertPolicy = await createPolicy({
        firstName,
        lastName,
        postalCode,
        policyNumber,
      });

      if (!insertPolicy) return Handle400Error(res, 'Failed to insert policy.');

      const insertPolicyDetails = await createPolicyDetails({
        policyNumber,
        firstName,
        lastName,
        policyType,
        policyName,
        licensePlate: vehicleNumber,
        VIN,
        year,
        make,
        model,
      });

      if (!insertPolicyDetails)
        return Handle400Error(res, 'Failed to insert policy details.');
      const data = {
        insertPolicyDetails,
        insertPolicy,
      };
      return Handle200Response(res, data);
    } catch (err) {
      return Handle500Error(err, req, res, next);
    }
  },
  GetPolicyDetailsByPolicyID: async function (req, res, next) {
    try {
      const {policyID} = req.params;
      if (!policyID) return Handle400Error(res, 'Policy ID is required.');
      const policyDetails = await findPolicyDetailsByPolicyID(policyID);
      if (!policyDetails) return Handle400Error(res, 'Policy not found.');
      return Handle200Response(res, policyDetails);
    } catch (err) {
      return Handle500Error(err, req, res, next);
    }
  },
};
