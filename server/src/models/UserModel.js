const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    organisation_id: {
      type: Schema.Types.ObjectId,
      ref: 'organisations',
    },
    first_name: {type: String, required: true, trim: true},
    last_name: {type: String, required: true, trim: true},
    email: {type: String, required: true, trim: true, unique: true},
    password: {type: String, required: true, trim: true},
    role_id: {
      type: Schema.Types.ObjectId,
      ref: 'roles',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    force_password_change: {type: Boolean, default: false, trim: true},
    refresh_token: {type: String},
  },
  {timestamps: true},
);

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;
