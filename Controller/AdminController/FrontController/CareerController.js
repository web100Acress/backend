const { isValidObjectId } = require("mongoose");
const careerModal = require("../../../models/career/careerSchema");
const cache = require("memory-cache");
const openModal = require("../../../models/career/opening");
const Application = require("../../../models/career/application");
const Onboarding = require("../../../models/hr/onboarding");
const {
  getEmbedding,
  cosineSimilarity,
  getTextFromUrl,
} = require("../../../Utilities/aiHelper");
// Use AWS SES-based mail helper instead of raw SMTP transporter
const fs = require("fs");
const {
  uploadFile,
  deleteFile,
  updateFile,
  sendEmail,
} = require("../../../Utilities/s3HelperUtility");
// const AWS = require("aws-sdk");
require("dotenv").config();

// AWS.config.update({
//   secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
//   accessKeyId: process.env.AWS_S3_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();
// const uploadFile = (file) => {
//   // Read the file content
//   // console.log("F.KAWHFIOQFJ");
//   const fileContent = fs.promises.readFileSync(file.path);

//   const params = {
//     Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
//     Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
//     Body: fileContent,
//     ContentType: file.mimetype,
//   };

//   // Return the promise from s3.upload
//   return s3.upload(params).promise();
// };
// const update = (file, objectKey) => {
//   const fileContent = fs.promises.readFileSync(file.path);
//   if (objectKey != null) {
//     const params = {
//       Bucket: "100acress-media-bucket",
//       Key: objectKey,
//       Body: fileContent,
//       ContentType: file.mimetype,
//     };
//     return s3.upload(params).promise();
//   } else {
//     const params = {
//       Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
//       Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
//       Body: fileContent,
//       ContentType: file.mimetype,
//     };

//     // Return the promise from s3.upload
//     return s3.upload(params).promise();
//   }
// };

// Helper: resolve a verified sender address. Prefer SES_FROM, then SMTP_FROM, then SMTP_USER.
// If nothing is configured, return an empty string so callers can fail fast with a clear message.
const getFromAddr = () => {
  const v = (process.env.SES_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "hr@100acress.com").trim();
  // prevent accidental localhost fallback
  if (!v || v.toLowerCase().endsWith("@localhost")) return "";
  return v;
};

class CareerController {
  static careerInsert = async (req, res) => {
    console.log(req.files, "jhfuirehiu");
    try {
      const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;

      if (
        !req.files ||
        !req.files.bannerImage ||
        !req.files.activityImage ||
        !req.files.highlightImage
      ) {
        return res.status(400).json({ error: "Image required !" });
      }
      const image1 = await uploadFile(req.files.bannerImage[0]);
      let image2 = [];
      if (req.files.activityImage) {
        image2 = await Promise.all(
          req.files.activityImage.map((file) => uploadFile(file)),
        );
      }

      let image3 = [];
      if (req.files.highlightImage) {
        image3 = await Promise.all(
          req.files.highlightImage.map((file) => uploadFile(file)),
        );
      }
      const data = new careerModal({
        bannerImage: {
          public_id: image1.Key,
          url: image1.Location,
        },
        highlightImage: image3.map((image) => ({
          public_id: image.Key,
          url: image.Location,
        })),
        activityImage: image2.map((image) => ({
          public_id: image.Key,
          url: image.Location,
        })),
        whyAcress: whyAcress,
        driveCulture: driveCulture,
        inHouse: inHouse,
        lifeAcress: lifeAcress,
      });
      await data.save();
      // Remove local files after successful upload
      req.files.bannerImage.forEach((file) => fs.unlinkSync(file.path));
      req.files.activityImage.forEach((file) => fs.unlinkSync(file.path));
      req.files.highlightImage.forEach((file) => fs.unlinkSync(file.path));
      res.status(200).json({
        message: "data sent successfully !",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal",
      });
    }
  };
  static careerView = async (req, res) => {
    // console.log("hello nfuih")
    try {
      const data = await careerModal.find();

      res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static careerEdit = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await careerModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
          data,
        });
      } else {
        res.status(200).json({
          message: "Check Id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static careerUpdate = async (req, res) => {
    try {
      // Destructure files for easier access
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const { bannerImage, activityImage, highlightImage } = req.files;
        const { whyAcress, driveCulture, inHouse, lifeAcress } = req.body;
        const data = await careerModal.findById({ _id: id });

        const bannerObjectKey = data.bannerImage.public_id;

        const activityObjectKey = data.activityImage.map((item) => {
          return item.public_id;
        });

        const highlighObjectKey = data.highlightImage.map((item) => {
          return item.public_id;
        });
        //  res.send(highlighObjectKey)
        // Example logic for updating database dynamically
        const updateData = {}; // Initialize an empty object
        if (bannerImage) {
          const uploadedBanner = await updateFile(
            bannerImage[0],
            bannerObjectKey,
          );
          updateData.bannerImage = {
            public_id: uploadedBanner.Key,
            url: uploadedBanner.Location,
          };
        }

        if (activityImage) {
          const uploadedActivities = await Promise.all(
            activityImage.map((file, index) =>
              updateFile(file, activityObjectKey[index]),
            ),
          );
          updateData.activityImage = uploadedActivities.map((image) => ({
            public_id: image.Key,
            url: image.Location,
          }));
        }

        if (highlightImage) {
          const uploadedHighlights = await Promise.all(
            highlightImage.map((file, index) =>
              updateFile(file, highlighObjectKey[index]),
            ),
          );
          updateData.highlightImage = uploadedHighlights.map((image) => ({
            public_id: image.Key,
            url: image.Location,
          }));
        }
        if (whyAcress != null) {
          updateData.whyAcress = whyAcress;
        }
        if (driveCulture != null) {
          updateData.driveCulture = driveCulture;
        }
        if (inHouse) {
          updateData.inHouse = inHouse;
        }
        if (lifeAcress) {
          updateData.lifeAcress = lifeAcress;
        }

        // Update only the fields that are present
        await careerModal.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({ message: "Career updated successfully!" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error!" });
    }
  };

  static careerDelete = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await careerModal.findById({ _id: id });
        const banner = data.bannerImage.public_id;
        if (banner) {
          const data = await deleteFile(banner);
          console.log(data, "data1");
        }
        const activity = data.activityImage;
        if (activity) {
          for (let i = 0; i < activity.length; i++) {
            const id = activity[i].public_id;
            if (id) {
              const data = await deleteFile(id);
              console.log(data, "data2");
            }
          }
        }
        const highlight = data.highlightImage;
        if (highlight) {
          for (let i = 0; i < highlight.length; i++) {
            const id = highlight[i].public_id;
            console.log(id, "data3");
            if (id) {
              const data = await deleteFile(id);
              console.log(data, "data3");
            }
          }
        }
        await careerModal.findByIdAndDelete({ _id: id });
        res.status(200).json({
          message: "data Deleted successfully !",
        });
      } else {
        res.status(200).json({
          message: "Invalid id ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  /////////////Openings API/////////////
  static openingInsert = async (req, res) => {
    try {
      const {
        jobLocation,
        jobTitle,
        responsibility,
        experience,
        skill,
        jobProfile,
      } = req.body;
      if (
        jobLocation &&
        jobTitle &&
        responsibility &&
        experience &&
        skill &&
        jobProfile
      ) {
        const data = new openModal({
          jobLocation: jobLocation,
          jobTitle: jobTitle,
          responsibility: responsibility,
          experience: experience,
          skill: skill,
          jobProfile: jobProfile,
        });
        // console.log(data,"lkwehdqxNZL")
        await data.save();
        res.status(200).json({
          message: "Data Sent successfully ! ",
        });
      } else {
        res.status(200).json({
          message: "Check field !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingView_all = async (req, res) => {
    try {
      // Query params: q, loc, exp, sort(newest|oldest), page, limit
      const {
        q = "",
        loc,
        exp,
        sort = "newest",
        page = 1,
        limit = 10,
      } = req.query || {};

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

      // Build filter
      const filter = {};
      if (loc) {
        filter.$or = [
          { jobLocation: loc },
          { location: loc },
        ];
      }
      if (q) {
        const regex = new RegExp(q, 'i');
        filter.$and = (filter.$and || []).concat([{
          $or: [
            { jobTitle: regex },
            { skill: regex },
            { jobLocation: regex },
            { location: regex },
          ],
        }]);
      }
      if (exp) {
        // Match textually in experience field for flexibility (e.g., "0-1", "2-4", "5+")
        const expRegex = new RegExp(exp, 'i');
        filter.$and = (filter.$and || []).concat([{ experience: expRegex }]);
      }

      const sortObj = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

      const total = await openModal.countDocuments(filter);
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(pageNum, totalPages);

      const data = await openModal
        .find(filter)
        .sort(sortObj)
        .skip((safePage - 1) * pageSize)
        .limit(pageSize);

      // Distinct locations across all openings for stable filter dropdown
      const distinctJobLocations = await openModal.distinct('jobLocation');
      const distinctLocations = await openModal.distinct('location');
      const locationsDistinct = Array.from(new Set([
        ...distinctJobLocations.filter(Boolean),
        ...distinctLocations.filter(Boolean),
      ]));

      return res.status(200).json({
        message: "data get successfully !",
        data,
        meta: {
          page: safePage,
          pageSize,
          total,
          totalPages,
          locationsDistinct,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingView_id = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await openModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
          data,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingEdit = async (req, res) => {
    // console.log("hello")
    try {
      const id = req.params.id;
      // console.log(id)
      if (isValidObjectId(id)) {
        const data = await openModal.findById({ _id: id });
        res.status(200).json({
          message: "data get successfully !",
        });
      } else {
        res.status(400).json({
          message: "Invalid id !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };
  static openingUpdate = async (req, res) => {
    try {
      const {
        jobLocation,
        jobTitle,
        responsibility,
        experience,
        skill,
        jobProfile,
      } = req.body;
      const id = req.params.id;
      if (isValidObjectId(id)) {
        if (
          jobLocation &&
          jobTitle &&
          responsibility &&
          experience &&
          skill &&
          jobProfile
        ) {
          const data = await openModal.findByIdAndUpdate(
            { _id: id },
            {
              jobLocation: jobLocation,
              jobTitle: jobTitle,
              responsibility: responsibility,
              experience: experience,
              skill: skill,
              jobProfile: jobProfile,
            },
          );
          await data.save();
          res.status(200).json({
            message: "Data updated successfully !",
          });
        } else {
          res.status(400).json({
            message: "data missing!",
          });
        }
      } else {
        res.status(400).json({
          message: "invalid object id pass !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static openingDelete = async (req, res) => {
    try {
      const id = req.params.id;
      if (isValidObjectId(id)) {
        const data = await openModal.findByIdAndDelete({ _id: id });
        res.status(200).json({
          message: "Data deleted successfully !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error !",
      });
    }
  };

  ///////////// Applications API ///////////
  static applyForOpening = async (req, res) => {
    try {
      const openingId = req.params.id;
      const { name, email, phone, resumeUrl, coverLetter } = req.body || {};
      if (!openingId || !isValidObjectId(openingId)) {
        return res.status(400).json({ message: "Invalid opening id" });
      }
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      const opening = await openModal.findById(openingId);
      if (!opening) return res.status(404).json({ message: "Opening not found" });

      // If resume file is attached, upload to S3
      let resumeUrlFinal = resumeUrl;
      if (req.file) {
        try {
          const uploaded = await uploadFile(req.file);
          resumeUrlFinal = uploaded?.Location || resumeUrlFinal;
        } catch (e) {
          console.error("Resume upload failed", e);
        }
      }

      const app = await Application.create({
        openingId,
        name,
        email,
        phone,
        resumeUrl: resumeUrlFinal,
        coverLetter,
      });
      return res.status(200).json({ message: "Application submitted", data: app });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  static listApplicationsByOpening = async (req, res) => {
    try {
      const openingId = req.params.id;
      if (!openingId || !isValidObjectId(openingId)) {
        return res.status(400).json({ message: "Invalid opening id" });
      }
      const list = await Application.find({ openingId }).sort({ createdAt: -1 });
      return res.status(200).json({ message: "ok", data: list });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  static approveApplication = async (req, res) => {
    try {
      const appId = req.params.appId;
      if (!appId || !isValidObjectId(appId)) {
        return res.status(400).json({ message: "Invalid application id" });
      }
      // Load application first
      const app = await Application.findById(appId);
      if (!app) return res.status(404).json({ message: "Application not found" });

      // Attempt to send email FIRST
      try {
        const fromAddr = getFromAddr();
        if (!fromAddr) {
          return res.status(500).json({ message: 'Email sender not configured. Set SES_FROM or SMTP_FROM to a verified SES identity.' });
        }
        const siteUrl = process.env.SITE_URL || 'https://www.100acress.com';
        const html = `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:#0ea5e9;padding:18px 24px;color:#fff;font-size:20px;font-weight:bold;">
                    100acress — Application Shortlisted
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 8px;font-size:16px;">Hi ${app.name || 'Candidate'},</td>
                </tr>
                <tr>
                  <td style="padding:0 24px 8px;font-size:16px;line-height:1.6;">
                    Great news! Your application has been <strong style="color:#16a34a;">shortlisted</strong> for the next round. Our team will contact you shortly with the next steps.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px;font-size:16px;line-height:1.6;">
                    In the meantime, feel free to explore more about us at <a href="${siteUrl}" style="color:#0ea5e9;text-decoration:none;">100acress.com</a>.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px;">
                    <a href="${siteUrl}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Visit 100acress</a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;color:#6b7280;padding:16px 24px;font-size:13px;">
                    Regards,<br/>100acress HR Team • <a href="${siteUrl}" style="color:#0ea5e9;text-decoration:none;">100acress.com</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>`;
        const ok = await sendEmail(app.email, fromAddr, [], 'Application Shortlisted - 100acress', html, true);
        if (!ok) throw new Error('SES sendEmail returned false');
      } catch (mailErr) {
        console.error('Mail error:', mailErr);
        // Do NOT mark approved if email failed
        return res.status(502).json({ message: 'Mail send failed, approval not saved' });
      }

      // Send notification to HR
      try {
        const fromAddr = getFromAddr();
        const hrEmail = "hr@100acress.com";
        if (fromAddr && hrEmail) {
          const opening = await openModal.findById(app.openingId);
          const jobTitle = opening ? opening.jobTitle : "N/A";

          const siteUrl = process.env.SITE_URL || 'https://www.100acress.com';
          const htmlHr = `
            <p>Hi HR Team,</p>
            <p>The following application has been <strong>approved</strong>:</p>
            <ul>
              <li><strong>Job Title:</strong> ${jobTitle}</li>
              <li><strong>Applicant Name:</strong> ${app.name}</li>
              <li><strong>Email:</strong> ${app.email}</li>
              <li><strong>Phone:</strong> ${app.phone || 'N/A'}</li>
              <li><strong>Resume:</strong> ${app.resumeUrl ? `<a href="${app.resumeUrl}">View Resume</a>` : 'N/A'}</li>
              <li><strong>Cover Letter:</strong> ${app.coverLetter || 'N/A'}</li>
            </ul>
            <p>You can view all applications for this job <a href="${siteUrl}/admin/jobposting/applications/${app.openingId}">here</a>.</p>
            <p>Regards,<br/>100acress Website</p>
          `;
          await sendEmail(hrEmail, fromAddr, [], `Application Approved: ${app.name} for ${jobTitle}`, htmlHr, false);
        }
      } catch (hrMailErr) {
        console.error('HR notification mail error:', hrMailErr);
        // Do not block for HR mail failure
      }

      // Only if mail succeeded, persist approved status
      app.status = 'approved';
      await app.save();

      // Create onboarding record if not exists
      try {
        const exists = await Onboarding.findOne({ applicationId: app._id });
        if (!exists) {
          await Onboarding.create({
            applicationId: app._id,
            openingId: app.openingId,
            candidateName: app.name,
            candidateEmail: app.email,
            currentStageIndex: 0,
            history: [{ stage: 'interview1', note: 'Auto-created on approval' }]
          });
        }
      } catch (e) {
        console.error('Failed to create onboarding entry:', e);
      }

      return res.status(200).json({ message: "Application approved and email sent", data: app });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  static rejectApplication = async (req, res) => {
    try {
      const appId = req.params.appId;
      if (!appId || !isValidObjectId(appId)) {
        return res.status(400).json({ message: "Invalid application id" });
      }
      const app = await Application.findById(appId);
      if (!app) return res.status(404).json({ message: "Application not found" });

      // Send regret mail FIRST
      try {
        const fromAddr = getFromAddr();
        if (!fromAddr) {
          return res.status(500).json({ message: 'Email sender not configured. Set SES_FROM or SMTP_FROM to a verified SES identity.' });
        }
        const siteUrl = process.env.SITE_URL || 'https://www.100acress.com';
        const html = `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:#ef4444;padding:18px 24px;color:#fff;font-size:20px;font-weight:bold;">
                    100acress — Application Update
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 8px;font-size:16px;">Hi ${app.name || 'Candidate'},</td>
                </tr>
                <tr>
                  <td style="padding:0 24px 8px;font-size:16px;line-height:1.6;">
                    Thank you for your interest in joining <strong>100acress</strong>. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px;font-size:16px;line-height:1.6;">
                    We encourage you to stay connected and explore future opportunities with us at <a href="${siteUrl}" style="color:#0ea5e9;text-decoration:none;">100acress.com</a>.
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px;">
                    <a href="${siteUrl}" style="background:#374151;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Explore Careers</a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;color:#6b7280;padding:16px 24px;font-size:13px;">
                    Regards,<br/>100acress HR Team • <a href="${siteUrl}" style="color:#0ea5e9;text-decoration:none;">100acress.com</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>`;
        const ok = await sendEmail(app.email, fromAddr, [], 'Application Update - 100acress', html, true);
        if (!ok) throw new Error('SES sendEmail returned false');
      } catch (mailErr) {
        console.error('Mail error:', mailErr);
        return res.status(502).json({ message: 'Mail send failed, rejection not saved' });
      }

      // Send notification to HR
      try {
        const fromAddr = getFromAddr();
        const hrEmail = "hr@100acress.com";
        if (fromAddr && hrEmail) {
          const opening = await openModal.findById(app.openingId);
          const jobTitle = opening ? opening.jobTitle : "N/A";
          const siteUrl = process.env.SITE_URL || 'https://www.100acress.com';
          const htmlHr = `
            <p>Hi HR Team,</p>
            <p>The following application has been <strong>rejected</strong>:</p>
            <ul>
              <li><strong>Job Title:</strong> ${jobTitle}</li>
              <li><strong>Applicant Name:</strong> ${app.name}</li>
              <li><strong>Email:</strong> ${app.email}</li>
              <li><strong>Phone:</strong> ${app.phone || 'N/A'}</li>
            </ul>
            <p>You can view all applications for this job <a href="${siteUrl}/admin/jobposting/applications/${app.openingId}">here</a>.</p>
            <p>Regards,<br/>100acress Website</p>
          `;
          await sendEmail(hrEmail, fromAddr, [], `Application Rejected: ${app.name} for ${jobTitle}`, htmlHr, false);
        }
      } catch (hrMailErr) {
        console.error('HR notification mail error:', hrMailErr);
        // Do not block for HR mail failure
      }

      // Persist rejected status after successful mail
      app.status = 'rejected';
      await app.save();
      return res.status(200).json({ message: 'Application rejected and email sent', data: app });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Lightweight aggregate: total applications (and by status)
  static applicationsCount = async (req, res) => {
    try {
      const total = await Application.countDocuments({});
      const approved = await Application.countDocuments({ status: 'approved' });
      const pending = await Application.countDocuments({ status: { $ne: 'approved' } });
      return res.status(200).json({ message: 'ok', count: total, byStatus: { approved, pending } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  static scoreApplications = async (req, res) => {
    try {
      const openingId = req.params.id;
      if (!openingId || !isValidObjectId(openingId)) {
        return res.status(400).json({ message: "Invalid opening id" });
      }

      const opening = await openModal.findById(openingId);
      if (!opening) {
        return res.status(404).json({ message: "Opening not found" });
      }

      // Combine job details into a single text for a comprehensive embedding
      const jobDescriptionText = `
        Job Title: ${opening.jobTitle || ""}
        Location: ${opening.jobLocation || ""}
        Experience: ${opening.experience || ""}
        Skills: ${opening.skill || ""}
        Profile: ${opening.jobProfile || ""}
        Responsibilities: ${opening.responsibility || ""}
      `.trim();

      // Add a check for minimum content length
      if (jobDescriptionText.length < 50) {
        return res.status(400).json({ message: "Job description is too short to be scored. Please add more details to the job opening (like skills, profile, and responsibilities)." });
      }

      const jobEmbedding = await getEmbedding(jobDescriptionText);
      if (!jobEmbedding) {
        return res.status(500).json({ message: "Failed to create embedding for job description. Check AI service logs for details." });
      }

      // Find applications that haven't been scored yet
      const unscoredApps = await Application.find({ openingId, matchScore: { $exists: false } });

      if (unscoredApps.length === 0) {
        return res.status(200).json({ message: "All applications for this job have already been scored." });
      }

      let scoredCount = 0;
      for (const app of unscoredApps) {
        if (!app.resumeUrl) continue;

        const resumeText = await getTextFromUrl(app.resumeUrl);
        if (!resumeText) continue;

        const resumeEmbedding = await getEmbedding(resumeText);
        if (!resumeEmbedding) continue;

        const score = cosineSimilarity(jobEmbedding, resumeEmbedding);

        // Update the application with the score
        app.matchScore = score;
        await app.save();
        scoredCount++;
      }

      return res.status(200).json({
        message: `Scoring complete. ${scoredCount} of ${unscoredApps.length} applications were scored.`,
        scoredCount,
      });
    } catch (error) {
      console.error("Error during application scoring:", error);
      return res.status(500).json({ message: "Internal server error during scoring." });
    }
  };
}
module.exports = CareerController;
