const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const {User, Role, Organisation} = require('../models');
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

module.exports = {
  /**
   * Register or onboarding of the business
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns API response
   */
  RegisterBusiness: async (req, res, next) => {
    try {
      const {business = null, user = null} = req.body;

      if (!business || !user)
        return Handle400Error(res, 'Business or User details is missing.');

      const {name, type, email, mobile, address, amenities, about_us} =
        business;
      if (
        !name ||
        !type ||
        !email ||
        !mobile ||
        !address ||
        !amenities ||
        !about_us
      )
        return Handle400Error(res, 'Please provide all business details.');
      const {
        first_name,
        last_name,
        email: user_email,
        password,
        confirm_password,
      } = user;
      if (
        !first_name ||
        !last_name ||
        !user_email ||
        !password ||
        !confirm_password
      )
        return Handle400Error(res, 'Please provide all user details.');

      if (password !== confirm_password)
        return Handle400Error(res, 'Password did not matched.');

      if (!ValidateEmail(user_email) || !ValidateEmail(email))
        return Handle400Error(res, 'Invalid email.');

      const business_manager_role = await FindOne({
        model: Role,
        where: {role_name: 'BUSINESS MANAGER', status: 'ACTIVE'},
        select: {_id: 1, role_name: 1},
      });

      if (!business_manager_role)
        return Handle400Error(
          res,
          'Unable to find active business manager role',
        );

      // TODO : Check email id of both business , user and mobile does not already exists

      // TODO : Create business

      // Create user with that organization id
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      const created_user_details = await Insert({
        model: User,
        data: {
          first_name,
          last_name,
          email: user_email,
          password: password_hash,
          role_id: business_manager_role._id,
          refresh_token: GeneratePassword(20),
        },
      });

      const response = {
        first_name: created_user_details.first_name,
        last_name: created_user_details.last_name,
        email: created_user_details.email,
        status: created_user_details.status,
        refresh_token: created_user_details.refresh_token,
        _id: created_user_details._id,
        createdAt: created_user_details.createdAt,
        updatedAt: created_user_details.updatedAt,
        role: business_manager_role,
      };

      response.access_token_expiry = moment().add(
        env.token_expiry_limit,
        'minutes',
      );
      response.access_token = jwt.sign({response}, env.secret, {
        expiresIn: env.token_expiry_limit + 'm',
      });

      return Handle200Response(res, response);
    } catch (err) {
      return Handle500Error(err, req, res, next);
    }
  },
  /**
   * Login of any user / business / superadmin
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns API response
   */
  Login: async (req, res, next) => {
    try {
      const {email = null, password = null} = req.body;

      if (!ValidateEmail(email))
        return Handle400Error(res, 'Invalid email id.');

      let user_details = await Aggregate({
        model: User,
        data: [
          {$match: {email: email}},
          {
            $lookup: {
              from: 'roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role_details',
            },
          },
          {
            $unwind: '$role_details',
          },
          {
            $set: {
              role: {
                _id: '$role_details._id',
                role_name: '$role_details.role_name',
              },
            },
          },
          {
            $unset: ['role_details'],
          },
          {
            $unset: ['role_id'],
          },
        ],
      });

      if (!user_details[0])
        return Handle400Error(res, 'Invalid email or password.');

      user_details = user_details[0];

      if (!(await bcrypt.compare(password, user_details.password)))
        return Handle400Error(res, 'Invalid email or password.');

      const refresh_token = GeneratePassword(20);

      const update_user_details = await FindAndUpdate({
        model: User,
        where: {
          _id: user_details._id,
        },
        update: {
          refresh_token: refresh_token,
        },
      });

      const response = {
        first_name: user_details.first_name,
        last_name: user_details.last_name,
        email: user_details.email,
        status: user_details.status,
        refresh_token: refresh_token,
        _id: user_details._id,
        createdAt: update_user_details.createdAt,
        updatedAt: update_user_details.updatedAt,
        role: user_details.role,
      };

      response.access_token_expiry = moment().add(
        env.token_expiry_limit,
        'minutes',
      );
      response.access_token = jwt.sign({response}, env.secret, {
        expiresIn: env.token_expiry_limit + 'm',
      });

      return Handle200Response(res, response);
    } catch (err) {
      return Handle500Error(err, req, res, next);
    }
  },
  /**
   * Refresh the access token on expiry
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @returns API response
   */
  RefreshToken: async (req, res, next) => {
    try {
      const {email = null, refresh_token = null} = req.body;

      const new_refresh_token = GeneratePassword(20);

      const user_details = await FindAndUpdate({
        model: User,
        where: {
          email: email,
          refresh_token: refresh_token,
        },
        update: {
          refresh_token: new_refresh_token,
        },
      });

      if (!user_details)
        return Handle400Error(res, 'Invalid email or refresh token.');

      const response = {
        refresh_token: new_refresh_token,
        _id: user_details._id,
        email: user_details.email,
        createdAt: user_details.createdAt,
        updatedAt: user_details.updatedAt,
      };

      response.access_token_expiry = moment().add(
        env.token_expiry_limit,
        'minutes',
      );
      response.access_token = jwt.sign({response}, env.secret, {
        expiresIn: env.token_expiry_limit + 'm',
      });

      return Handle200Response(res, response);
    } catch (err) {
      return Handle500Error(err, req, res, next);
    }
  },
};
