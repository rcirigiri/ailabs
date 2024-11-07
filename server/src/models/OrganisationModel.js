const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganisationSchema = new Schema(
  {
    name: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true},
    email: {type: String, required: true, trim: true, unique: true},
    mobile: {type: String, required: true, trim: true, unique: true},
    password: {type: String, required: true, trim: true},
    address: {type: String, required: true, trim: true},
    about_us: {type: String, required: true, trim: true},
    amenities: {
      type: [String],
      default: [],
    },
  },
  {timestamps: true},
);

const OrganisationModel = mongoose.model('organisations', OrganisationSchema);
module.exports = OrganisationModel;
