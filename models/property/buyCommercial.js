const mongoose = require("mongoose");

const buyCommercial_Schema = new mongoose.Schema({
  frontImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  otherImage: [],
  propertyName: {
    type: String,
    required: true,
  },
  propertyType: {
    type: String, //here we mention 1bhk or
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  descripation: {
    type: String,
    required: true,
  },
  amenities: [
    {
      type: String,
      required: true,
    },
  ],
  type: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  furnishing: {
    type: String,
    required: true,
  },
  landMark: {
    type: String,
    required: true,
  },
  builtYear: {
    type: String,
    required: true,
  },
  availableDate: {
    type: String,
  },
  schema_type: {
    type: String,
    default: "buy",
  },
});
const buyCommercial_Model = mongoose.model(
  "BuyCommercial_Property",
  buyCommercial_Schema,
);
module.exports = buyCommercial_Model;
