const mongoose = require("mongoose");

const property_Schema = new mongoose.Schema({
  frontImage: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  otherImage: [],
  propertyType: {
    type: String, // means for resident home ,or for commercial like warehouse
  },
  propertyName: {
    type: String,
  },
  price: {
    type: String,
  },
  priceunits: {
    type: String,
    default: "",
  },
  bedrooms: {
    type: Number,
    default: 0,
  },
  bathrooms: {
    type: Number,
    default: 0,
  },
  area: {
    type: String,
  },
  availableDate: {
    type: String,
  },
  descripation: {
    type: String,
  },
  furnishing: {
    type: String,
  },
  builtYear: {
    Type: String,
  },
  amenities: [
    {
      type: String,
    },
  ],
  landMark: {
    type: String,
  },
  type: {
    type: String,
  }, //resident or commercial
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
  },
  number: {
    type: String,
  },
  verify: {
    type: String,
    default: "unverified"
  },
  propertyLooking: {
    type: String,
  },
},
  { timestamps: true }
);
// Text index moved to parent schema for correct embedded filtering
const post_Schema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, //Email Pattern
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
    },
    // Optional profile image URL to keep parity with RegisterData model
    avatarUrl: {
      type: String,
      default: "",
    },
    postProperty: [property_Schema],

    role: {
      type: String,
      enum: ["user", "Owner", "Builder", "Agent", "propertyOwner", "Seller", "Admin", "ContentWriter", "blog", "SalesHead", "sales_head"],
      required: true,
    },
    token: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    // Email/WhatsApp verification reminder tracking (production scheduler)
    verifyReminder10mLockAt: { type: Date, default: null },
    verifyReminder10mSentAt: { type: Date, default: null },
    verifyReminder24hLockAt: { type: Date, default: null },
    verifyReminder24hSentAt: { type: Date, default: null },
    verifyReminder7dLockAt: { type: Date, default: null },
    verifyReminder7dSentAt: { type: Date, default: null },
    verifyReminderWeeklyLockAt: { type: Date, default: null },
    verifyReminderWeeklySentAt: { type: Date, default: null },

    // Post Property reminders after verification (only if user hasn't posted any property)
    postPropertyReminder10mLockAt: { type: Date, default: null },
    postPropertyReminder10mSentAt: { type: Date, default: null },
    postPropertyReminder24hLockAt: { type: Date, default: null },
    postPropertyReminder24hSentAt: { type: Date, default: null },
    postPropertyReminder7dLockAt: { type: Date, default: null },
    postPropertyReminder7dSentAt: { type: Date, default: null },
    postPropertyReminderWeeklyLockAt: { type: Date, default: null },
    postPropertyReminderWeeklySentAt: { type: Date, default: null },

    // Array of liked project ids for consistency with RegisterData
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "projectData",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Correct text index for embedded properties
post_Schema.index({
  "postProperty.propertyName": "text",
  "postProperty.propertyType": "text",
  "postProperty.address": "text",
  "postProperty.city": "text",
  "postProperty.price": "text",
  "postProperty.state": "text",
  "postProperty.type": "text",
  "postProperty.landMark": "text",
  "postProperty.descripation": "text",
});

// Index for cron job performance (frequent verification status checks)
post_Schema.index({ emailVerified: 1 });
post_Schema.index({ role: 1 }); // Admin user filtering

const postPropertyModel = mongoose.model("postProperty", post_Schema);
module.exports = postPropertyModel;
