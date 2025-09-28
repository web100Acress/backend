const InsightContact = require('../../Models/InsightContact');
const { sendEmail } = require('../../Utilities/s3HelperUtility');
const transporter = require('../../Utilities/Nodemailer');

class InsightContactController {

  // Submit contact form (Public route)
  static async contact_Insert(req, res) {
    try {
      console.log('📝 Contact form submission received:', req.body);

      const { firstName, lastName, email, phone, inquiryType, message } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !phone || !inquiryType || !message) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Create new contact
      const contact = new InsightContact({
        firstName,
        lastName,
        email,
        phone,
        inquiryType,
        message,
        source: 'GetInTouch Form',
        status: 'New'
      });

      await contact.save();
      console.log('✅ Contact saved to database:', contact._id);

      // Send email notification to admin
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Get In Touch Form - 100Acress</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 25px;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Contact Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${firstName} ${lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Inquiry Type:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                      <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${inquiryType}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold;">Source:</td>
                    <td style="padding: 10px 0;">Get In Touch Form</td>
                  </tr>
                </table>
              </div>

              <div>
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Message:</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                  <p style="margin: 0; line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
                </div>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>This enquiry was submitted on ${new Date().toLocaleString('en-IN')}</p>
                <p>Please respond within 24 hours for best customer experience.</p>
              </div>
            </div>
          </div>
        `;

        const mailOptions = {
          from: process.env.SMTP_USER || 'support@100acress.com',
          to: 'support@100acress.com',
          subject: `New Contact Form Enquiry - ${firstName} ${lastName}`,
          html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Contact email sent successfully');

      } catch (emailError) {
        console.error('❌ Error sending contact email:', emailError);
        // Don't fail the request if email fails, just log it
      }

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you within 24 hours.',
        data: {
          id: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          inquiryType: contact.inquiryType,
          createdAt: contact.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Error in contact_Insert:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to submit contact form. Please try again.'
      });
    }
  }

  // Get all contacts (Admin only)
  static async getAllContacts(req, res) {
    try {
      console.log('📋 Fetching all contacts for admin');

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const contacts = await InsightContact.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await InsightContact.countDocuments({});
      const totalPages = Math.ceil(total / limit);

      console.log(`✅ Retrieved ${contacts.length} contacts`);

      res.status(200).json({
        success: true,
        data: contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalContacts: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('❌ Error in getAllContacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contacts'
      });
    }
  }

  // Update contact status (Admin only)
  static async updateContactStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      console.log(`🔄 Updating contact ${id} status to: ${status}`);

      if (!['New', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value'
        });
      }

      const contact = await InsightContact.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      console.log('✅ Contact status updated successfully');

      res.status(200).json({
        success: true,
        message: 'Contact status updated successfully',
        data: contact
      });

    } catch (error) {
      console.error('❌ Error in updateContactStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update contact status'
      });
    }
  }

  // Delete contact (Admin only)
  static async deleteContact(req, res) {
    try {
      const { id } = req.params;

      console.log(`🗑️ Deleting contact ${id}`);

      const contact = await InsightContact.findByIdAndDelete(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      console.log('✅ Contact deleted successfully');

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error in deleteContact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete contact'
      });
    }
  }
}

module.exports = InsightContactController;
