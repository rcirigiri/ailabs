const {User, Role} = require('../models');
const {
  IsExists,
  Insert,
  InsertMany,
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
} = require('../controllers/baseController');
const {
  LOG_LEVELS,
  SALT_ROUNDS,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
} = require('../utils/constants');
const bcrypt = require('bcryptjs');

/**
 * Add default roles as Super admin and business manager
 */
module.exports = {
  /**
   * Migrate DB
   */
  migrate: async () => {
    try {
      // Add roles
      const insertData = await InsertMany({
        model: Role,
        data: [{role_name: 'SUPER ADMIN'}, {role_name: 'BUSINESS MANAGER'}],
      });

      // Add default superadmin
      const password_hash = await bcrypt.hash(
        DEFAULT_ADMIN_PASSWORD,
        SALT_ROUNDS,
      );
      const userData = {
        first_name: 'Super',
        last_name: 'Admin',
        email: DEFAULT_ADMIN_USERNAME,
        password: password_hash,
        role_id: insertData[0]._id,
      };
      const superAdminCreated = await Insert({
        model: User,
        data: userData,
      });

      console.log('Migrated 1-add-default-roles.js', LOG_LEVELS.INFO);
    } catch (e) {
      console.log(e, LOG_LEVELS.FATAL);
    }
  },
  /**
   * Rollback DB
   */
  rollback: async () => {
    try {
      const deleteData = await Delete({
        model: Role,
        where: {role_name: {$in: ['SUPER ADMIN', 'BUSINESS MANAGER']}},
      });
      console.log('Rollback 1-add-default-roles.js', LOG_LEVELS.INFO);
    } catch (e) {
      console.log(e, LOG_LEVELS.FATAL);
    }
  },
};
