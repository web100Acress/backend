const Enquiry = require('../../models/Insight/Enquiry');
const { sendEmail } = require('../../Utilities/s3HelperUtility');

class EnquiryController {

  // Insert new enquiry
  static enquiry_Insert = async (req, res) => {
    try {
      const { name, email, mobile, query } = req.body;

      // Validate required fields
      if (!name || !email || !mobile || !query) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Create new enquiry
      const enquiryData = new Enquiry({
        name: name,
        email: email,
        mobile: mobile,
        query: query,
      });

      await enquiryData.save();

      // Email notification disabled as per user request
      /*
      // Send email notification
      const custName = enquiryData.name;
      const custEmail = enquiryData.email;
      const custMobile = enquiryData.mobile;
      const custQuery = enquiryData.query;

      let sourceEmail = "support@100acress.com";
      let to = "query.aadharhomes@gmail.com";
      let subject = "100acress Enquiry - Dark CTA Form";
      let html = `<!DOCTYPE html>
                      <html lang="en">
                      <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>New Customer Enquiry</title>
                      </head>
                      <body>
                          <h2>New Enquiry from Dark CTA Form</h2>
                          <p><strong>Customer Name:</strong> ${custName}</p>
                          <p><strong>Customer Email:</strong> ${custEmail}</p>
                          <p><strong>Customer Mobile:</strong> ${custMobile}</p>
                          <p><strong>Customer Query:</strong> ${custQuery}</p>
                          <p><strong>Submitted At:</strong> ${new Date(enquiryData.createdAt).toLocaleString()}</p>
                          <hr>
                          <p>Thank you!</p>
                      </body>
                      </html>`;

      try {
        const emailSuccess = await sendEmail(to, sourceEmail, [], subject, html, false);
        console.log("Email sent successfully", emailSuccess);
      } catch (error) {
        console.log("Error sending email", error);
        // Don't fail the request if email fails, just log it
      }
      */

      res.status(201).json({
        success: true,
        message: 'Enquiry submitted successfully',
        data: {
          id: enquiryData._id,
          name: enquiryData.name,
          email: enquiryData.email,
          mobile: enquiryData.mobile,
          query: enquiryData.query,
          status: enquiryData.status,
          createdAt: enquiryData.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating enquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting enquiry',
        error: error.message
      });
    }
  };

  // Get all enquiries (for admin)
  static getAllEnquiries = async (req, res) => {
    try {
      const enquiries = await Enquiry.find({})
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: enquiries.map(enquiry => ({
          id: enquiry._id,
          name: enquiry.name,
          email: enquiry.email,
          mobile: enquiry.mobile,
          query: enquiry.query,
          status: enquiry.status,
          source: enquiry.source,
          createdAt: enquiry.createdAt,
          updatedAt: enquiry.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error getting enquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching enquiries',
        error: error.message
      });
    }
  };

  // Update enquiry status (for admin)
  static updateEnquiryStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const enquiry = await Enquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found'
        });
      }

      enquiry.status = status;
      await enquiry.save();

      res.status(200).json({
        success: true,
        message: 'Enquiry status updated successfully',
        data: {
          id: enquiry._id,
          name: enquiry.name,
          email: enquiry.email,
          mobile: enquiry.mobile,
          query: enquiry.query,
          status: enquiry.status,
          source: enquiry.source,
          createdAt: enquiry.createdAt,
          updatedAt: enquiry.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating enquiry status',
        error: error.message
      });
    }
  };

  // Delete enquiry (for admin)
  static deleteEnquiry = async (req, res) => {
    try {
      const { id } = req.params;

      const enquiry = await Enquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found'
        });
      }

      await Enquiry.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Enquiry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting enquiry',
        error: error.message
      });
    }
  };
}

module.exports = EnquiryController;
