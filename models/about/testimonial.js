const mongoose = require("mongoose");

const testimonial_Schema = new mongoose.Schema(
  {
    image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    descripation: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
const testimonialModel = mongoose.model("testimonial", testimonial_Schema);
module.exports = testimonialModel;
