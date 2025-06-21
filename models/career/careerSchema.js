const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    bannerImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    activityImage: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],

    whyAcress: {},
    driveCulture: [],

    inHouse: [],

    lifeAcress: [],

    highlightImage: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);
const careerModal = mongoose.model("Career", careerSchema);
module.exports = careerModal;


// sdfblfb