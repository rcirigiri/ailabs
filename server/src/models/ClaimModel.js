const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    policyNumber: {
      required: false,
      type: String,
    },
    vehicle: {
      type: String,
      required: false,
    },
    claimNumber: {
      type: String,
      unique: true,
      required: true,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    postalCode: {
      type: String,
      required: false,
    },
    incidentDate: {
      type: Date,
      required: false,
    },
    lossLocation: {
      addressLine: {
        type: String,
        required: false,
      },
      state: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      postalCode: {
        type: String,
        required: false,
      },
    },
    vehicleDetails: {
      licensePlate: {
        type: String,
        required: false,
      },
      VIN: {
        type: String,
        required: false,
      },
      year: {
        type: String,
        required: false,
        min: 1886, // first car invented
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
    causeOfLoss: {
      type: String,
      required: false,
    },
    vehicleDamageDetails: {
      type: String,
      required: false,
    },
    claimSubmitted: {
      type: Boolean,
      default: false,
    },
    claimStatus: {
      type: String,
      default: 'pending',
    },
  },
  {timestamps: true},
);

const Claim = mongoose.model('Claim', ClaimSchema);
module.exports = Claim;
