const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    policyNumber: {
      required: true,
      type: String,
    },
    vehicle: {
      type: String,
      required: true,
    },
    claimNumber: {
      type: String,
      unique: true,
      required: true,
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
    incidentDate: {
      type: Date,
      required: true,
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
      required: true,
    },
    vehicleDamageDetails: {
      type: String,
      required: true,
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
