const jwt = require('jsonwebtoken');
const {env} = require('../config');
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
  Handle401Error,
} = require('../helpers');

const VerifyToken = (req, res, next) => {
  try {
    if (typeof req.headers.authorization !== 'undefined') {
      let token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, env.secret, async (err, user) => {
        if (err) return Handle401Error(res);
        console.log('>>>user', user);
        next();
      });
    } else return Handle401Error(res);
  } catch (err) {
    return Handle500Error(res, req, err);
  }
};

exports.VerifyToken = VerifyToken;
