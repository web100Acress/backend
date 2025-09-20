const mongoose = require("mongoose");

const blogEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: "" },
    message: { type: String, default: "" },

    // Blog context
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: "blogpost", required: true },
    blogTitle: { type: String, default: "" },
    blogSlug: { type: String, default: "" },

    // Related project snapshot (first related project from blog)
    project: {
      project_url: { type: String, default: "" },
      projectName: { type: String, default: "" },
      thumbnail: { type: String, default: "" },
    },

    source: { type: String, default: "blog-modal" },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BlogEnquiry = mongoose.model("blogEnquiry", blogEnquirySchema);
module.exports = BlogEnquiry;
