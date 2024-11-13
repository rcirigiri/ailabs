const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema(
  {
    // here _id will be primary key it will be treated as policy number
    policyNumber: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Policy = mongoose.model('policy', PolicySchema);
module.exports = Policy;
