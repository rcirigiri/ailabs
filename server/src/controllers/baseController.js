const fs = require('fs');
const sharp = require('sharp');
const {LOG_LEVELS} = require('../utils/constants');
/*
 * Database CURD methods below
 */

/**
 * To check if data exists in Database
 *
 * @async
 * @function IsExists
 * @param {{model: any, where?: object, select?: object}}
 * @`model` - Mongoose Model Instance
 * @`where` - Mongoose where query or null by default
 * @`select` - Mongoose select query or null by default
 * @return {(object | boolean)} an object from document if found else return false
 *
 * @example
 * await IsExists({model: User,where: { mobile: mobile }})
 */
const IsExists = async ({model, where = null, select = null}) => {
  try {
    let query = model.find(where);
    if (select) query.select(select);
    let doc = await query.lean().exec();
    if (doc.length > 0) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const IsExistsOne = async ({model, where = null, select = null}) => {
  try {
    let query = model.findOne(where);
    if (select) query.select(select);
    let doc = await query.lean().exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const Count = async ({model, where = null}) => {
  try {
    let query = model.count(where);
    let doc = await query.lean().exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const Insert = async ({model, data}) => {
  try {
    let inserted = await new model(data).save();
    return inserted;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const InsertMany = async ({model, data}) => {
  try {
    let inserted = await model.insertMany(data);
    return inserted;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const Find = async ({
  model,
  where,
  projection = {},
  select = null,
  sort = null,
  limit = null,
  skip = null,
  populate = null,
  populateField = null,
  distinct = null,
}) => {
  try {
    let query = model.find(where, projection);
    if (select) query.select(select);
    if (distinct) query.distinct(distinct);
    if (sort) query.sort(sort);
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);
    if (populate && populateField) query.populate(populate, populateField);
    else if (populate) query.populate(populate);
    let doc = await query.lean().exec();
    return doc;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const FindOne = async ({
  model,
  where = null,
  select = null,
  populate = null,
  sort = null,
  populateField = null,
}) => {
  try {
    let query = model.findOne(where);
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (populate && populateField) query.populate(populate, populateField);
    else if (populate) query.populate(populate);
    let doc = await query.lean().exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const FindAndUpdate = async ({model, where = {}, update = {}}) => {
  try {
    let query = model.findOneAndUpdate(where, update, {new: true});
    let doc = await query.exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const UpdateMany = async ({model, where, update}) => {
  try {
    let query = model.updateMany(where, update);
    let doc = await query.exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const Aggregate = async ({model, data}) => {
  try {
    let query = model.aggregate(data);
    let doc = await query.exec();
    if (doc) return doc;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const Delete = async ({model, where}) => {
  try {
    let query = model.deleteMany(where);
    let doc = await query.exec();
    if (doc) return true;
    else return false;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const CompressImageAndUpload = async (image, path = public_image_url) => {
  try {
    let time = new Date().getTime();
    let imagePath = path + time + '.jpg';
    //Any error from sharp will automatically handle in catch block returning false.
    let imageInfo = await sharp(image.data)
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      })
      .toFile(imagePath);
    return {
      path: imagePath.replace(/public/g, ''),
      size: imageInfo.size,
    };
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

const DeleteFile = async filepath => {
  try {
    let isDeleted = fs.unlinkSync('public' + filepath);
    return isDeleted;
  } catch (e) {
    console.log(e, LOG_LEVELS.ERROR);
    throw e;
  }
};

/*
 * Other internal methods below
 *
 */

const ValidateEmail = email => {
  let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase());
};

const ValidateMobile = mobile => {
  let re = /^\d{10,13}$/;
  return re.test(mobile);
};

const ValidateAlphanumeric = text => {
  let re = /^[a-zA-Z0-9\s]+$/;
  return re.test(String(text));
};

const ValidateLength = (text, max = 25, min = 1) => {
  return text.length >= min && text.length <= max ? true : false;
};

const PasswordStrength = password => {
  let re = /^(?=.*[a-z])(?=.*[A-Z])(?=.{8,24})(?=.*[0-9])(?=.*[@$!%*#?&])/;
  return re.test(password);
};

const isDataURL = s => {
  let regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
  return !!s.match(regex);
};

const GeneratePassword = (length = 8) => {
  let result = '';
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

exports.IsExists = IsExists;
exports.IsExistsOne = IsExistsOne;
exports.Insert = Insert;
exports.InsertMany = InsertMany;
exports.Count = Count;
exports.Find = Find;
exports.FindOne = FindOne;
exports.Delete = Delete;
exports.FindAndUpdate = FindAndUpdate;
exports.UpdateMany = UpdateMany;
exports.Aggregate = Aggregate;
exports.CompressImageAndUpload = CompressImageAndUpload;
exports.DeleteFile = DeleteFile;

exports.ValidateEmail = ValidateEmail;
exports.PasswordStrength = PasswordStrength;
exports.ValidateAlphanumeric = ValidateAlphanumeric;
exports.ValidateMobile = ValidateMobile;
exports.ValidateLength = ValidateLength;
exports.isDataURL = isDataURL;
exports.GeneratePassword = GeneratePassword;
