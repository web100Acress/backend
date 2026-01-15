const { totalmem } = require("os");
const blogModel = require("../../../models/blog/blogpost");
const Category = require("../../../models/blog/category");
const postPropertyModel = require("../../../models/postProperty/post");
const ProjectModel = require("../../../models/projectDetail/project");
const ObjectId = require("mongodb").ObjectId;
const {
  uploadFile,
  deleteFile,
  updateFile,
} = require("../../../Utilities/s3HelperUtility");
const { generateBlog } = require("../../../Utilities/geminiClient");

// Helpers for loose JSON parsing in case model wraps content strangely
function tryParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeCandidate(c) {
  return (c || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```+$/g, "")
    .replace(/^json\s*/i, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function parseLooseJson(text) {
  if (!text) return null;
  const candidates = [];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) candidates.push(fence[1]);
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    candidates.push(text.slice(first, last + 1));
  }
  candidates.push(text);
  for (const c of candidates) {
    const cleaned = normalizeCandidate(c);
    const parsed = tryParse(cleaned);
    if (parsed) return parsed;
  }
  return null;
}

function extractShallowFields(text) {
  if (!text) return {};
  const getField = (key) => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, "i"));
    return m && m[1] ? m[1] : "";
  };
  return {
    title: getField("title"),
    metaTitle: getField("metaTitle"),
    metaDescription: getField("metaDescription"),
    introduction: getField("introduction"),
    slug: getField("slug"),
  };
}

function buildBodyFromParsed(ai) {
  const intro = (ai?.introduction || "").toString().trim();
  const sections = Array.isArray(ai?.sections) ? ai.sections : [];
  const conclusion = (ai?.conclusion || "").toString().trim();
  const bodyHtmlField = (ai?.bodyHtml || ai?.contentHtml || "").toString().trim();
  const pieces = [];
  if (bodyHtmlField) pieces.push(bodyHtmlField);
  if (!bodyHtmlField && ai?.metaDescription) {
    pieces.push(`<p>${ai.metaDescription}</p>`);
  }
  if (intro) pieces.push(`<p>${intro}</p>`);
  sections.forEach((s) => {
    const heading = (s.heading || "").toString().trim();
    const content = (s.bodyHtml || "").toString().trim();
    if (heading) pieces.push(`<h2>${heading}</h2>`);
    if (content) pieces.push(content);
  });
  if (conclusion) pieces.push(`<p>${conclusion}</p>`);
  return pieces.filter(Boolean).join("");
}
const fs = require("fs");
const BlogEnquiry = require("../../../models/blog/blogEnquiry");
const mailer = require("../../../Utilities/Nodemailer");

class blogController {
  static blog_insert = async (req, res) => {
    try {
      // Debug: Log environment variables (remove in production)
      console.log('🔍 AWS Config Check:', {
        hasAccessKey: !!process.env.AWS_S3_ACCESS_KEY,
        hasSecretKey: !!process.env.AWS_S3_SECRET_ACESS_KEY,
        hasRegion: !!process.env.AWS_REGION,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket"
      });

      // Check if AWS credentials are configured
      const hasAWSConfig = process.env.AWS_S3_ACCESS_KEY && process.env.AWS_S3_SECRET_ACESS_KEY;
      if (!hasAWSConfig) {
        console.warn('⚠️ AWS credentials not configured - will use placeholder image');
      }

      // Image upload is now completely optional

      const { blog_Title, author, blog_Description, blog_Category, metaTitle, metaDescription, slug } = req.body;
      let string_blog_Description = blog_Description;
      const isPublished = req.body.isPublished === 'true';

      if (
        !blog_Title ||
        !string_blog_Description ||
        !author ||
        !blog_Category
      ) {

        return res.status(400).json({ message: "Missing fields" });
      }
      // Handle image upload
      let imageData;

      if (req.file && hasAWSConfig) {
        // Upload file to S3 if AWS is configured
        console.log('📤 Uploading file to S3...');
        try {
          imageData = await uploadFile(req.file);
          console.log('✅ S3 upload successful:', imageData);
        } catch (s3Error) {
          console.error('❌ S3 upload failed:', s3Error);

          // Fallback: use embedded SVG placeholder
          imageData = {
            Key: `temp/${Date.now()}-${req.file?.originalname || 'placeholder'}`,
            Location: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EBlog Image%3C/text%3E%3C/svg%3E`
          };
        }
      } else {
        // Use placeholder image when no file or no AWS config
        console.log('📷 Using placeholder image');
        imageData = {
          Key: `placeholder/${Date.now()}-blog-image`,
          Location: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EBlog Image%3C/text%3E%3C/svg%3E`
        };
      }

      // Save blog entry
      console.log('Saving blog to database...');

      // Add CDN URL if it's a real S3 upload
      const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
      let blogImageData = {
        public_id: imageData.Key,
        url: imageData.Location,
      };

      // Add CDN URL for S3 uploads
      if (imageData.Key && !imageData.Location.startsWith('data:')) {
        blogImageData.cdn_url = cloudfrontUrl + imageData.Key;
      }

      // Parse related projects (accept JSON string or array)
      let relatedProjects = [];
      try {
        const raw = req.body.relatedProjects;
        if (raw) {
          const arr = Array.isArray(raw) ? raw : JSON.parse(raw);
          if (Array.isArray(arr)) {
            relatedProjects = arr
              .map((p) => ({
                project_url: (p.project_url || p.pUrl || p.slug || '').toString().trim(),
                projectName: (p.projectName || p.name || '').toString().trim(),
                thumbnail: (p.thumbnail || p.thumb || p.thumbnailImage || '').toString().trim(),
              }))
              .filter((p) => p.project_url);
          }
        }
      } catch (_) { }

      // Parse FAQs
      let enableFAQ = false;
      let faqs = [];
      try {
        enableFAQ = String(req.body.enableFAQ).toLowerCase() === 'true' || req.body.enableFAQ === true;
      } catch (_) { }
      try {
        const rawFaqs = req.body.faqs;
        if (rawFaqs) {
          const arr = Array.isArray(rawFaqs) ? rawFaqs : JSON.parse(rawFaqs);
          if (Array.isArray(arr)) {
            faqs = arr.map(f => ({
              question: (f.question || '').toString().trim(),
              answer: (f.answer || '').toString(),
            })).filter(f => f.question && f.answer);
          }
        }
      } catch (_) { }

      const newBlog = new blogModel({
        blog_Image: blogImageData,
        blog_Title,
        blog_Description: string_blog_Description,
        author,
        blog_Category,
        isPublished,
        relatedProjects: relatedProjects && relatedProjects.length ? relatedProjects : undefined,
        enableFAQ: enableFAQ || (faqs && faqs.length > 0) || false,
        faqs: faqs && faqs.length ? faqs : undefined,
        // SEO fields
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        slug: slug || undefined,
      });
      await newBlog.save();
      console.log('Blog saved successfully');

      // Clean up local file
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Local file cleaned up');
        } catch (cleanupError) {
          console.warn('Failed to cleanup local file:', cleanupError);
        }
      }

      res
        .status(200)
        .json({ message: "Blog inserted successfully", data: newBlog });
    } catch (error) {
      console.error('Blog insert error:', error);

      // Clean up local file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup local file on error:', cleanupError);
        }
      }

      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.code === 'CredentialsError') {
        errorMessage = "AWS credentials error - check environment variables";
      } else if (error.code === 'NoSuchBucket') {
        errorMessage = "AWS S3 bucket not found";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.name === 'MongoError') {
        errorMessage = "Database connection error";
      }

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  static blog_view = async (req, res) => {
    try {
      // res.send("bsdbk.kkjnc cnf")
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      // Coerce and clamp params for performance and safety
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const sortField = (typeof sortBy === 'string' && sortBy.trim()) || 'createdAt';
      const sortDir = (String(sortOrder).toLowerCase() === 'asc') ? 1 : -1;
      const skip = (pageNum - 1) * limitNum;

      const data = await blogModel
        .find({ isPublished: true })
        .select('blog_Title blog_Image blog_Category author createdAt slug isPublished views likes shares commentsCount')
        .skip(skip)
        .limit(limitNum)
        .sort({ [sortField]: sortDir })
        .lean();
      const totalBlogs = await blogModel.countDocuments({ isPublished: true });
      if (data) {
        res.status(200).json({
          message: "Data get successfull ! ",
          data,
          totalPages: Math.ceil(totalBlogs / limitNum),
        });
      } else {
        res.status(200).json({
          message: "Data not found ! ",
          data,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Itnernal server error !",
      });
    }
  };

  // Admin endpoint to view ALL blogs (published + drafts)
  static admin_blog_view = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 1000, // High limit for admin to see all blogs
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 100));
      const sortField = (typeof sortBy === 'string' && sortBy.trim()) || 'createdAt';
      const sortDir = (String(sortOrder).toLowerCase() === 'asc') ? 1 : -1;
      const skip = (pageNum - 1) * limitNum;

      // Get ALL blogs regardless of publish status, but project only list fields
      const data = await blogModel
        .find({})
        .select('blog_Title blog_Image blog_Category author createdAt slug isPublished views likes shares commentsCount')
        .skip(skip)
        .limit(limitNum)
        .sort({ [sortField]: sortDir })
        .lean();
      const totalBlogs = await blogModel.countDocuments({});

      console.log(`Admin blog view: Found ${data.length} blogs out of ${totalBlogs} total`);

      // Debug: Log image data for each blog
      // data.forEach(blog => {
      //   console.log(`Blog "${blog.blog_Title}": Image URL = ${blog.blog_Image?.url}, CDN URL = ${blog.blog_Image?.cdn_url}`);
      // });

      if (data) {
        res.status(200).json({
          message: "Admin data retrieved successfully",
          data,
          totalPages: Math.ceil(totalBlogs / limitNum),
          totalBlogs,
          publishedBlogs: data.filter(blog => blog.isPublished === true).length,
          draftBlogs: data.filter(blog => blog.isPublished === false).length,
        });
      } else {
        res.status(200).json({
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      console.error("Admin blog view error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  static Draft_view = async (req, res) => {
    try {
      // res.send("bsdbk.kkjnc cnf")
      const {
        page = 1,
        limit = 10,
      } = req.query;

      const skip = (page - 1) * limit;
      const data = await blogModel.find({ isPublished: false }).skip(skip).limit(limit);
      const totalDrafts = await blogModel.countDocuments({ isPublished: false });
      if (data) {
        return res.status(200).json({
          message: "Data get successfull ! ",
          data,
          totalPages: Math.ceil(totalDrafts / limit)
        });
      } else {
        return res.status(200).json({
          message: "Data not found ! ",
          data,
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Itnernal server error !",
      });
    }
  };
  static blog_viewId = async (req, res) => {
    // console.log("hsbasdjk")
    try {
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        // Determine whether to count the view for this request
        const shouldCount = (() => {
          const q = (req.query?.countView || '').toString().toLowerCase();
          return q === '1' || q === 'true';
        })();
        // Helper: extract client IP
        const getClientIp = (req) => {
          try {
            let ip = (req.headers['x-forwarded-for'] || '').toString();
            if (ip) ip = ip.split(',')[0].trim();
            if (!ip) ip = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
            if (ip && ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
            return ip;
          } catch (_) { return ''; }
        };
        // Private/local IP detection
        const isPrivateIp = (ip) => {
          if (!ip) return true; // treat unknown as private to be safe
          if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
          if (/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(ip)) return true;
          return false;
        };
        const clientIp = getClientIp(req);
        const excludedList = (process.env.EXCLUDED_VIEW_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
        const countLocal = String(process.env.COUNT_LOCAL_VIEWS || '').toLowerCase() === 'true';
        const isExcluded = excludedList.includes(clientIp) || (!countLocal && isPrivateIp(clientIp));
        let data;
        if (shouldCount && !isExcluded) {
          // Atomically increment views and return the updated doc
          data = await blogModel.findByIdAndUpdate(
            { _id: id },
            { $inc: { views: 1 } },
            { new: true }
          );
        } else {
          data = await blogModel.findById({ _id: id });
        }
        res.status(201).json({
          message: "Data get successfully",
          data,
        });
      } else {
        res.status(404).json({
          message: "Not found !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  static blog_edit = async (req, res) => {
    try {
      console.log('Blog edit request received for ID:', req.params.id);

      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        console.log('Invalid blog ID format:', id);
        return res.status(400).json({
          message: "Invalid blog ID format",
        });
      }

      // Test database connection
      console.log('Testing database connection...');
      const dbState = blogModel.db.readyState;
      console.log('Database state:', dbState);

      if (dbState !== 1) {
        console.error('Database not connected. State:', dbState);
        return res.status(500).json({
          message: "Database connection error",
        });
      }

      const data = await blogModel.findById({ _id: id });
      if (!data) {
        console.log('Blog not found with ID:', id);
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      console.log('Blog found:', data.blog_Title);
      res.status(200).json({
        message: "Data get successfully ! ",
        data,
      });
    } catch (error) {
      console.error('Blog edit error:', error);

      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.name === 'CastError') {
        errorMessage = "Invalid blog ID format";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.name === 'MongoError') {
        errorMessage = "Database connection error";
      }

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  static blog_update = async (req, res) => {
    try {
      const id = req.params.id;
      if (ObjectId.isValid(id)) {
        const { blog_Title, blog_Description, author, blog_Category, metaTitle, metaDescription, slug } = req.body;
        const isPublished = req.body.isPublished === 'true';
        console.log("isPublished: ", isPublished);

        const doc = await blogModel.findById({ _id: id });
        if (!doc) {
          return res.status(404).json({ message: "Blog not found" });
        }

        // Update core fields
        if (typeof blog_Title !== 'undefined') doc.blog_Title = blog_Title;
        if (typeof blog_Description !== 'undefined') doc.blog_Description = blog_Description;
        if (typeof author !== 'undefined') doc.author = author;
        if (typeof blog_Category !== 'undefined') doc.blog_Category = blog_Category;
        if (typeof isPublished !== 'undefined') doc.isPublished = isPublished;

        // SEO fields
        if (typeof metaTitle !== 'undefined') doc.metaTitle = metaTitle;
        if (typeof metaDescription !== 'undefined') doc.metaDescription = metaDescription;
        if (typeof slug !== 'undefined' && slug !== '') doc.slug = slug; // will be normalized in pre-save

        // Related projects (optional)
        try {
          const raw = req.body.relatedProjects;
          if (typeof raw !== 'undefined') {
            const arr = Array.isArray(raw) ? raw : JSON.parse(raw);
            if (Array.isArray(arr)) {
              doc.relatedProjects = arr
                .map((p) => ({
                  project_url: (p.project_url || p.pUrl || p.slug || '').toString().trim(),
                  projectName: (p.projectName || p.name || '').toString().trim(),
                  thumbnail: (p.thumbnail || p.thumb || p.thumbnailImage || '').toString().trim(),
                }))
                .filter((p) => p.project_url);
            } else if (raw === null) {
              doc.relatedProjects = [];
            }
          }
        } catch (_) { /* ignore */ }

        // FAQs (optional)
        try {
          // enableFAQ can be boolean or string 'true'/'false'
          if (typeof req.body.enableFAQ !== 'undefined') {
            const flag = (String(req.body.enableFAQ).toLowerCase() === 'true') || (req.body.enableFAQ === true);
            doc.enableFAQ = flag;
          }
          if (typeof req.body.faqs !== 'undefined') {
            const rawFaqs = req.body.faqs;
            if (rawFaqs === null) {
              doc.faqs = [];
            } else {
              const arr = Array.isArray(rawFaqs) ? rawFaqs : JSON.parse(rawFaqs);
              if (Array.isArray(arr)) {
                doc.faqs = arr
                  .map(f => ({
                    question: (f.question || '').toString().trim(),
                    answer: (f.answer || '').toString(),
                  }))
                  .filter(f => f.question && f.answer);
                // if entries exist, auto-enable
                if (doc.faqs.length > 0 && typeof req.body.enableFAQ === 'undefined') {
                  doc.enableFAQ = true;
                }
              }
            }
          }
        } catch (_) { /* ignore */ }

        // Optional image update
        if (req.file) {
          console.log('[blog_update] Received file:', {
            originalname: req.file?.originalname,
            mimetype: req.file?.mimetype,
            size: req.file?.size,
            path: req.file?.path,
          });
          // Check AWS config (keys + region)
          const hasAWSConfig = !!(process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID)
            && !!(process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
            && !!process.env.AWS_REGION;
          console.log('[blog_update] hasAWSConfig:', hasAWSConfig, 'region:', process.env.AWS_REGION);
          try {
            let imageData;
            if (hasAWSConfig) {
              try {
                const currentKey = doc.blog_Image?.public_id;
                console.log('[blog_update] Updating S3 object. currentKey:', currentKey);
                imageData = await updateFile(req.file, currentKey);
                console.log('[blog_update] S3 update success:', { Key: imageData?.Key, Location: imageData?.Location });
              } catch (s3Err) {
                // Graceful fallback on any S3 error
                console.error('[blog_update] S3 update failed, using placeholder. Error:', s3Err?.message || s3Err);
                imageData = {
                  Key: `placeholder/${Date.now()}-blog-image`,
                  Location: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EBlog Image%3C/text%3E%3C/svg%3E`
                };
              }
            } else {
              // Fallback: embedded SVG placeholder to avoid 500s when AWS is not configured
              console.warn('[blog_update] AWS not configured. Using placeholder image.');
              imageData = {
                Key: `placeholder/${Date.now()}-blog-image`,
                Location: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EBlog Image%3C/text%3E%3C/svg%3E`
              };
            }

            // Map returned data + optional CDN url
            const cloudfrontUrl = "https://d16gdc5rm7f21b.cloudfront.net/";
            const nextImage = {
              public_id: imageData.Key,
              url: imageData.Location,
            };
            if (imageData.Key && !imageData.Location.startsWith('data:')) {
              nextImage.cdn_url = cloudfrontUrl + imageData.Key;
            }
            doc.blog_Image = nextImage;
            console.log('[blog_update] Assigned blog_Image:', nextImage);
          } finally {
            // Clean up local temp file
            try { if (req.file?.path) { fs.unlinkSync(req.file.path); console.log('[blog_update] Temp file cleaned:', req.file.path); } } catch (e) { console.warn('[blog_update] Temp cleanup failed:', e?.message || e); }
          }
        }

        await doc.save();
        return res.status(200).json({ message: "data updated successfully !" });
      } else {
        res.status(404).json({
          message: "not found!",
        });
      }
    } catch (error) {
      console.error('[blog_update] Error:', error);
      // Provide more specific error messages (e.g., duplicate slug)
      if (error && (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000))) {
        return res.status(400).json({ message: 'Slug already exists. Please choose a different slug.' });
      }
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error', details: error.message });
      }
      return res.status(500).json({ message: "Internal server error", error: error?.message });
    }
  };

  static blog_update_ispublished = async (req, res) => {
    try {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const isPublished = req.body.isPublished;
      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({ message: "Invalid isPublished value" });
      }

      const updatedBlog = await blogModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isPublished } },
        { new: true }
      );

      if (!updatedBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      return res.status(200).json({
        message: "Status updated successfully!",
        data: updatedBlog
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  };

  static blog_delete = async (req, res) => {
    try {
      console.log('Delete request received for blog ID:', req.params.id);

      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        console.log('Invalid blog ID format:', id);
        return res.status(400).json({
          message: "Invalid blog ID format",
        });
      }

      // Find the blog first
      const data = await blogModel.findById({ _id: id });
      if (!data) {
        console.log('Blog not found with ID:', id);
        return res.status(404).json({
          message: "Blog not found",
        });
      }

      console.log('Blog found:', data.blog_Title);

      // Delete from S3 if image exists
      if (data.blog_Image && data.blog_Image.public_id) {
        try {
          console.log('Deleting image from S3:', data.blog_Image.public_id);
          await deleteFile(data.blog_Image.public_id);
          console.log('S3 image deleted successfully');
        } catch (s3Error) {
          console.error('S3 delete error:', s3Error);
          // Continue with blog deletion even if S3 delete fails
        }
      } else {
        console.log('No S3 image to delete');
      }

      // Delete from database
      console.log('Deleting blog from database...');
      const deleteResult = await blogModel.findByIdAndDelete({ _id: id });

      if (!deleteResult) {
        console.log('Database delete failed');
        return res.status(500).json({
          message: "Failed to delete blog from database",
        });
      }

      console.log('Blog deleted successfully');
      res.status(200).json({
        message: "Blog deleted successfully",
        deletedBlog: {
          id: data._id,
          title: data.blog_Title
        }
      });

    } catch (error) {
      console.error('Blog delete error:', error);

      // Provide more specific error messages
      let errorMessage = "Internal server error";
      if (error.name === 'CastError') {
        errorMessage = "Invalid blog ID format";
      } else if (error.name === 'ValidationError') {
        errorMessage = "Database validation error";
      } else if (error.code === 'CredentialsError') {
        errorMessage = "AWS credentials error";
      }

      res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Inline image upload endpoint for the editor toolbar
  static upload_inline_image = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Upload the received file to S3 (reuse existing helper)
      let imageData;
      try {
        imageData = await uploadFile(req.file);
      } catch (s3Error) {
        // Ensure local temp file is removed even on failure
        if (req.file && req.file.path) {
          try { fs.unlinkSync(req.file.path); } catch { }
        }
        return res.status(500).json({ message: "Failed to upload to storage" });
      }

      // Clean up local file after successful upload
      if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch { }
      }

      // Respond with the public URL in the expected shape
      return res.status(200).json({ data: { url: imageData.Location } });
    } catch (error) {
      console.error('upload_inline_image error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Submit a blog enquiry (public)
  static submit_blog_enquiry = async (req, res) => {
    try {
      const { name, mobile, email = "", message = "", blogId, blogTitle = "", blogSlug = "", project } = req.body || {};
      if (!name || !mobile || !blogId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const doc = await BlogEnquiry.create({
        name,
        mobile,
        email,
        message,
        blogId,
        blogTitle,
        blogSlug,
        project: {
          project_url: project?.project_url || "",
          projectName: project?.projectName || "",
          thumbnail: project?.thumbnail || "",
        },
        source: req.body?.source || 'blog-modal',
      });

      // Send email (best-effort)
      try {
        const to = process.env.ENQUIRY_TO_EMAIL || process.env.SMTP_USER;
        if (to && mailer) {
          await mailer.sendMail({
            to,
            from: process.env.ENQUIRY_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@100acress.com',
            subject: `New Blog Enquiry: ${blogTitle || 'Blog'} - ${name}`,
            html: `
              <h2>New Blog Enquiry</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Phone:</strong> ${mobile}</p>
              ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              <hr />
              <p><strong>Blog:</strong> ${blogTitle} (${blogSlug})</p>
              ${doc.project?.projectName ? `<p><strong>Related Project:</strong> ${doc.project.projectName}</p>` : ''}
              ${doc.project?.project_url ? `<p><strong>Project URL:</strong> ${doc.project.project_url}</p>` : ''}
            `.trim(),
          });
          try { await BlogEnquiry.findByIdAndUpdate(doc._id, { $set: { emailSent: true } }); } catch (_) { }
        }
      } catch (mailErr) {
        console.warn('submit_blog_enquiry: mail send failed:', mailErr?.message || mailErr);
      }

      return res.status(201).json({ message: 'Enquiry submitted', data: doc });
    } catch (error) {
      console.error('submit_blog_enquiry error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Admin list of blog enquiries
  static list_blog_enquiries = async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [rows, total] = await Promise.all([
        BlogEnquiry.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        BlogEnquiry.countDocuments({}),
      ]);

      return res.status(200).json({ message: 'OK', data: rows, total, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      console.error('list_blog_enquiries error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Admin delete blog enquiry
  static delete_blog_enquiry = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid id' });
      }
      const deleted = await BlogEnquiry.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Not found' });
      }
      return res.status(200).json({ message: 'Deleted', data: { id } });
    } catch (error) {
      console.error('delete_blog_enquiry error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Categories
  static list_categories = async (req, res) => {
    try {
      const cats = await Category.find({}).sort({ name: 1 }).lean();
      return res.status(200).json({ message: "OK", data: cats });
    } catch (error) {
      console.error('list_categories error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  static create_category = async (req, res) => {
    try {
      const nameRaw = (req.body?.name || '').trim();
      if (!nameRaw) {
        return res.status(400).json({ message: "Category name is required" });
      }
      // Case-insensitive dedupe
      const regex = new RegExp(`^${nameRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      let existing = await Category.findOne({ name: regex });
      if (existing) {
        return res.status(200).json({ message: "Category already exists", data: existing });
      }
      const created = await Category.create({ name: nameRaw });
      return res.status(201).json({ message: "Category created", data: created });
    } catch (error) {
      console.error('create_category error:', error);
      // Handle duplicate key
      if (error?.code === 11000) {
        return res.status(200).json({ message: "Category already exists" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Fetch blog by slug
  static blog_by_slug = async (req, res) => {
    try {
      const raw = (req.params?.slug || '').toString();
      // Use EXACT same slugify logic as the model (NO trailing hyphen trim)
      const normalized = (raw || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      if (!normalized) {
        return res.status(404).json({ message: 'Invalid slug' });
      }

      let blog = await blogModel.findOne({ slug: normalized, isPublished: true });

      if (!blog) {
        blog = await blogModel.findOne({
          slug: { $regex: new RegExp(`^${normalized.replace(/[-]/g, '[-]?')}$`, 'i') },
          isPublished: true
        });
      }

      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      return res.status(200).json({ message: 'Blog found', data: blog });
    } catch (error) {
      console.error('blog_by_slug error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Check slug availability (normalized)
  // Uses the same slugify logic as the model pre-save hook for consistency
  static slug_check = async (req, res) => {
    try {
      const raw = (req.params?.slug || '').toString();
      // Use the same normalization as the model's slugify function
      const normalized = raw
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/-+/g, '-')            // Collapse multiple hyphens
        .replace(/^-+|-+$/g, '')        // Trim leading/trailing hyphens
        .slice(0, 100);

      if (!normalized) {
        return res.status(400).json({ message: 'Invalid slug' });
      }

      // First try exact match
      let existing = await blogModel.findOne({ slug: normalized }).select('_id slug blog_Title');

      // If no exact match, try case-insensitive regex match to handle edge cases
      if (!existing) {
        existing = await blogModel.findOne({
          slug: { $regex: new RegExp(`^${normalized.replace(/[-]/g, '[-]?')}$`, 'i') }
        }).select('_id slug blog_Title');
      }

      if (existing) {
        return res.status(200).json({ message: 'Slug taken', data: { exists: true, id: existing._id, slug: existing.slug, title: existing.blog_Title } });
      }
      return res.status(200).json({ message: 'Slug available', data: { exists: false, slug: normalized } });
    } catch (error) {
      console.error('slug_check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // Search projects for admin blog editor
  static search_projects = async (req, res) => {
    try {
      const { q = '', limit = 10 } = req.query;
      const searchTerm = q.toString().trim();

      let query = {};

      // If search term is provided, use search criteria
      if (searchTerm && searchTerm.length >= 2) {
        const searchRegex = new RegExp(searchTerm, 'i');
        query = {
          $or: [
            { projectName: searchRegex },
            { project_url: searchRegex },
            { builderName: searchRegex }
          ]
        };
      }
      // If no search term, get all projects (for dropdown)

      console.log('[search_projects] Query:', query);
      console.log('[search_projects] Limit:', Math.min(parseInt(limit) || 100, 100));

      // Use the correct Project model rather than postPropertyModel
      const projects = await ProjectModel
        .find(query)
        .select('projectName project_url thumbnailImage builderName city state minPrice maxPrice')
        .limit(Math.min(parseInt(limit) || 100, 100))
        .lean();

      console.log('[search_projects] Found projects count:', projects.length);
      console.log('[search_projects] Sample project:', projects[0]);

      const formattedProjects = projects.map(project => ({
        project_url: project.project_url || '',
        projectName: project.projectName || '',
        // Prefer CDN URL if present, else fall back to URL string or nested object shapes
        thumbnail: (typeof project.thumbnailImage === 'string')
          ? project.thumbnailImage
          : (project.thumbnailImage?.cdn_url || project.thumbnailImage?.url || ''),
        builderName: project.builderName || '',
        location: `${project.city || ''}, ${project.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        minPrice: project.minPrice ?? null,
        maxPrice: project.maxPrice ?? null
      }));

      return res.status(200).json({
        message: 'Projects found',
        data: formattedProjects,
        total: formattedProjects.length
      });
    } catch (error) {
      console.error('search_projects error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  // --- AI blog generation ---
  static generate_and_insert = async (req, res) => {
    try {
      const topic = (req.body?.topic || '').toString().trim();
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
      }

      // Validate key before calling Gemini
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: 'GEMINI_API_KEY not configured on backend' });
      }

      const author = (req.body?.author || 'Admin').toString().trim() || 'Admin';
      const blog_Category =
        (req.body?.blog_Category || req.body?.category || 'General')
          .toString()
          .trim() || 'General';
      const isPublished =
        String(req.body?.isPublished).toLowerCase() === 'true' ||
        req.body?.isPublished === true;

      // Call Gemini to generate content (parsed + raw fallback)
      const aiResult = await generateBlog(topic);
      let ai = aiResult?.parsed || {};
      const rawText = aiResult?.rawText || '';

      // If parsing failed in client, attempt again here
      const aiFromRaw = rawText
        ? parseLooseJson(rawText) || tryParse(normalizeCandidate(rawText))
        : null;
      if (!ai || Object.keys(ai).length === 0) {
        ai = aiFromRaw || {};
      }
      // If still empty, try shallow extraction
      if (!ai || Object.keys(ai).length === 0) {
        ai = extractShallowFields(rawText);
      }

      // Build HTML description from parts
      // Build HTML body from structured fields
      let bodyHtml = buildBodyFromParsed(ai);

      // If empty, try from aiFromRaw
      if (!bodyHtml && aiFromRaw && Object.keys(aiFromRaw).length) {
        bodyHtml = buildBodyFromParsed(aiFromRaw);
      }

      // Fallbacks
      if (!bodyHtml && ai?.contentHtml) {
        bodyHtml = ai.contentHtml.toString();
      }
      if (!bodyHtml && ai?.metaDescription) {
        bodyHtml = `<p>${ai.metaDescription}</p>`;
      }
      if (!bodyHtml && ai?.introduction) {
        bodyHtml = `<p>${ai.introduction}</p>`;
      }
      if (!bodyHtml && rawText) {
        const cleaned = normalizeCandidate(rawText)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        bodyHtml = `<p>${cleaned}</p>`;
      }

      const faqs = (Array.isArray(ai.faqs) ? ai.faqs : [])
        .map((f) => ({
          question: (f.question || '').toString().trim(),
          answer: (f.answer || '').toString(),
        }))
        .filter((f) => f.question && f.answer);

      // Placeholder image (reuse existing pattern)
      const imageData = {
        Key: `placeholder/${Date.now()}-blog-image`,
        Location:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='160' font-family='Arial' font-size='16' text-anchor='middle' fill='%236b7280'%3EBlog Image%3C/text%3E%3C/svg%3E",
      };

      const newBlog = new blogModel({
        blog_Image: imageData,
        blog_Title: ai.title || ai.metaTitle || topic,
        blog_Description: bodyHtml || ai.contentHtml || ai.introduction || rawText,
        author,
        blog_Category,
        isPublished,
        enableFAQ: faqs.length > 0,
        faqs: faqs.length ? faqs : undefined,
        metaTitle: ai.metaTitle || ai.title || undefined,
        metaDescription: ai.metaDescription || undefined,
        slug: ai.slug || ai.title || topic,
      });

      await newBlog.save();

      return res.status(201).json({
        message: 'Blog generated and saved',
        data: newBlog,
      });
    } catch (error) {
      console.error('generate_and_insert error:', error);
      const isKeyMissing =
        error?.message === 'GEMINI_API_KEY missing' ||
        error?.message === 'GEMINI_API_KEY not configured';

      // Try to extract Gemini API message if present
      const modelMessage =
        error?.response?.data?.error?.message ||
        error?.response?.error?.message ||
        error?.message;

      const rawResponse = error?.response?.data || error?.response || null;
      const rawText = error?.rawText;

      const message = isKeyMissing
        ? 'GEMINI_API_KEY not configured'
        : modelMessage || 'Failed to generate blog';

      return res.status(500).json({
        message,
        detail: modelMessage,
        raw: rawResponse,
        rawText,
      });
    }
  };

  // --- Engagement Endpoints ---
  static like = async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
      const userIdentity = (req.headers['x-user-id'] || req.body?.userId || req.body?.email || req.headers['x-user-email'] || req.ip || '').toString().trim().toLowerCase();
      const doc = await blogModel.findById(id).select('likes shares commentsCount views likedBy');
      if (!doc) return res.status(404).json({ message: 'Not found' });
      const already = userIdentity && Array.isArray(doc.likedBy) && doc.likedBy.includes(userIdentity);
      if (!already) {
        doc.likes = (doc.likes || 0) + 1;
        if (!Array.isArray(doc.likedBy)) doc.likedBy = [];
        if (userIdentity) doc.likedBy.push(userIdentity);
        await doc.save();
      }
      return res.status(200).json({ message: 'OK', data: doc });
    } catch (e) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  static share = async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
      const updated = await blogModel.findByIdAndUpdate(
        { _id: id },
        { $inc: { shares: 1 } },
        { new: true }
      ).select('likes shares commentsCount views');
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.status(200).json({ message: 'OK', data: updated });
    } catch (e) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  static unlike = async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
      const userIdentity = (req.headers['x-user-id'] || req.body?.userId || req.body?.email || req.headers['x-user-email'] || req.ip || '').toString().trim().toLowerCase();
      const doc = await blogModel.findById(id).select('likes shares commentsCount views likedBy');
      if (!doc) return res.status(404).json({ message: 'Not found' });
      const had = userIdentity && Array.isArray(doc.likedBy) && doc.likedBy.includes(userIdentity);
      if (had) {
        doc.likes = Math.max(0, (doc.likes || 0) - 1);
        doc.likedBy = doc.likedBy.filter(u => u !== userIdentity);
        await doc.save();
      }
      return res.status(200).json({ message: 'OK', data: doc });
    } catch (e) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  static add_comment = async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
      const name = (req.body?.name || 'Anonymous').toString().trim().slice(0, 80);
      const message = (req.body?.message || '').toString().trim();
      if (!message) return res.status(400).json({ message: 'Message is required' });
      const update = {
        $push: { comments: { name, message, createdAt: new Date() } },
        $inc: { commentsCount: 1 }
      };
      const updated = await blogModel.findByIdAndUpdate({ _id: id }, update, { new: true })
        .select('likes shares commentsCount views comments');
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.status(201).json({ message: 'Comment added', data: updated });
    } catch (e) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  static get_engagement = async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
      const doc = await blogModel.findById({ _id: id }).select('likes shares commentsCount views comments');
      if (!doc) return res.status(404).json({ message: 'Not found' });
      return res.status(200).json({ message: 'OK', data: doc });
    } catch (e) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}
module.exports = blogController;