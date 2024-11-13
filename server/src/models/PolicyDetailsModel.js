const mongoose = require('mongoose');

const PolicyDetailsSchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    policyType: {
      type: String,
      required: true,
      trim: true,
    },
    policyName: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: false,
      trim: true,
    },
    VIN: {
      type: String,
      required: false,
    },
    year: {
      type: String,
      required: false,
    },
    make: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const PolicyDetails = mongoose.model('policy_details', PolicyDetailsSchema);
module.exports = PolicyDetails;
