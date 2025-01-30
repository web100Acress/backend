//contact controller for handling opertion related contact page
// contac page   models
const contactModel = require("../../../models/contact");
const nodemailer = require("nodemailer");
const contactPagedetailModel = require("../../../models/contactdetail");

// const sendPostEmail = async (email ,mobile) => {
//     const transporter = await nodemailer.createTransport({
//         service:'gmail',
//         port:465,
//         secure:true,
//         logger:false,
//         debug:true,
//         secureConnection:false,
//         auth: {
//             // user: process.env.Email,
//             //pass: process.env.EmailPass
//             user:"web.100acress@gmail.com",
//             pass:"txww gexw wwpy vvda"
//         },
//         tls:{
//             rejectUnAuthorized:true
//         }
//     });
//     // Send mail with defined transport objec
//     let info = await transporter.sendMail({
//         from: 'amit100acre@gmail.com', // Sender address
//         to: 'query.aadharhomes@gmail.com', // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
//         subject: 'Project Enquiry',
//         html: `
//         <!DOCTYPE html>
//         <html lang:"en>
//         <head>
//         <meta charset:"UTF-8">
//         <meta http-equiv="X-UA-Compatible"  content="IE=edge">
//         <meta name="viewport"  content="width=device-width, initial-scale=1.0">
//         <title>New Customer Message </title>
//         </head>
//         <body>
//             <h1>Customer Message</h1>
//             <p>A new Enquiry : ${email}</p>
//             <p>A new Enquiry : ${mobile}</p>
//             <p>Please review the details and take necessary actions.</p>
//             <p>Thank you!</p>
//         </body>
//         </html>
// `
//     });

// }

class contactController {
  static contact = async (req, res) => {
    res.send("contact page controlller api listen");
  };
  // contact page banner work
  // contact customer section page form
  // method for inserting custmer detail

  static contact_Insert = async (req, res) => {
    //  console.log("hello post ")
    // console.log(req.body)
    try {
      const { name, email, mobile, message } = req.body;
      if (mobile) {
        const userData = new contactModel({
          name: name,
          email: email,
          mobile: mobile,
          message: message,
        });
        // console.log(userData)
        await userData.save();

        //   await sendPostEmail(email,mobile)

        const custName = userData.name;
        const custEmail = userData.email;
        const custMobile = userData.mobile;
        const custMessage = userData.message;

        //   await sendPostEmail(email,mobile)
        const transporter = await nodemailer.createTransport({
          service: "gmail",
          port: 465,
          secure: true,
          logger: false,
          debug: true,
          secureConnection: false,
          auth: {
            // user: process.env.Email,
            //pass: process.env.EmailPass
            user: "web.100acress@gmail.com",
            pass: "txww gexw wwpy vvda",
          },
          tls: {
            rejectUnAuthorized: true,
          },
        });
        // Send mail with defined transport objec
        let info = await transporter.sendMail({
          from: "amit100acre@gmail.com", // Sender address
          to: "query.aadharhomes@gmail.com", // List of receivers (admin's email) =='query.aadharhomes@gmail.com' email
          subject: "100acress Enquiry-Home Page",
          html: `
            <!DOCTYPE html>
            <html lang:"en>
            <head>
            <meta charset:"UTF-8">
            <meta http-equiv="X-UA-Compatible"  content="IE=edge">
            <meta name="viewport"  content="width=device-width, initial-scale=1.0">
            <title>New Customer Message </title>
            </head>
            <body>
                <p>Customer Name : ${custName}</p>
                <p>Customer Email : ${custEmail}</p>
                <p>Customer Mobile : ${custMobile}</p>
                <p>Customer Message : ${custMessage}</p>
                <p>Thank you!</p>
            </body>
            </html>
    `,
        });

        res.status(200).json({
          message: "your message send !",
          data: userData,
        });
      } else {
        res.status(403).json({
          message: "check your field ! ",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // method for view the customer detail
  static contact_view = async (req, res) => {
    try {
      const data = await contactModel.findById(req.params.id);
      res.status(201).json({
        message: "data get sucessfully",
        dataview: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  static contactviewAll = async (req, res) => {
    // console.log("view")
    try {
      const data = await contactModel.find();
      // res.send(data)
      res.status(200).json({
        message: "data get successfully ! ",
        data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "internal server error ! ",
      });
    }
  };
  // method for delete the customer detail
  static contact_delete = async (req, res) => {
    // console.log('helllo  delete customer details')
    try {
      const data = await contactModel.findByIdAndDelete(req.params.id);
      res.status(201).json({
        message: "data deleted sucessfully!",
        dataDelete: data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error ! ",
      });
    }
  };
  //  contact page companyt detail
  //contact page detail insert api
  static contact_pagedetail = async (req, res) => {
    // console.log('helllo  ')
    try {
      const {
        companyName,
        contactNumber,
        telephonenumber,
        email,
        address,
        descripation,
        heading,
        detail,
      } = req.body;
      if (
        companyName &&
        contactNumber &&
        telephonenumber &&
        email &&
        address &&
        descripation &&
        req.files
      ) {
        const banner = req.files.contact_banner;
        const bannerResult = await cloudinary.uploader.upload(
          banner.tempFilePath,
          {
            folder: "100acre/ContactbannerImage",
          },
        );
        const data = new contactPagedetailModel({
          contact_banner: {
            public_id: bannerResult.public_id, //banner image for contact page
            url: bannerResult.secure_url,
          },
          companyName: companyName,
          contactNumber: contactNumber,
          telephonenumber: telephonenumber,
          email: email,
          address: address,
          descripation: descripation,
          heading: heading, //heading on the banner image
          detail: detail, // detail on the banner image
        });
        // console.log(data)
        await data.save();
        res.status(201).json({
          message: "data posted successfully !",
          detail: data,
        });
      } else {
        res.status(403).json({
          message: "check all field !",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "internal server error!",
      });
    }
  };

  static contact_pagedetail_edit = async (req, res) => {
    // console.log('helo')
    try {
      const id = req.params.id;
      const data = await contactPagedetailModel.findById({ _id: id });
      res.status(201).json({
        message: "data editing is enable ",
        dataedit: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: " internal server error !",
      });
    }
  };

  //view
  static contact_pagedetail_view = async (req, res) => {
    try {
      const data = await contactPagedetailModel.findById(req.params.id);
      res.status(201).json({
        message: "data get successfull ! ",
        dataview: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Internal server error !",
      });
    }
  };
  static contactpagedetail_viewAll = async (req, res) => {
    // console.log("hello")
    try {
      const data = await contactPagedetailModel.find();
      // res.send(data)
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
  //update
  static contact_pagedetail_update = async (req, res) => {
    try {
      if (req.files) {
        const contact = await contactPagedetailModel.findById(req.params.id);
        // console.log(data)
        const bannerId = contact.contact_banner.public_id;
        await cloudinary.uploader.destroy(bannerId);

        const image = req.files.contact_banner;
        const imageResult = await cloudinary.uploader.upload(
          image.tempFilePath,
          {
            folder: "100acre/ProjectImage",
          },
        );
        const id = req.params.id;
        const data = await contactPagedetailModel.findByIdAndUpdate(id, {
          contact_banner: {
            public_id: imageResult.public_id,
            url: imageResult.secure_url,
          },
          companyName: req.body.companyName,
          contactNumber: req.body.contactNumber,
          telephonenumber: req.body.telephonenumber,
          email: req.body.email,
          address: req.body.address,
          descripation: req.body.descripation,
          heading: req.body.heading,
          detail: req.body.detail,
        });
        await data.save(data);
        res.status(201).json({
          message: "updated!",
          dataUpdated: data,
        });
      } else {
        const id = req.params.id;
        const data = await contactPagedetailModel.findByIdAndUpdate(id, {
          companyName: req.body.companyName,
          contactNumber: req.body.contactNumber,
          telephonenumber: req.body.telephonenumber,
          email: req.body.email,
          address: req.body.address,
          descripation: req.body.descripation,
          heading: req.body.heading,
          detail: req.body.detail,
        });
        await data.save(data);
        res.status(201).json({
          message: "updated",
          dataUpdated: data,
        });
        // console.log("helo")
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Internal server error !",
      });
    }
  };
  //delete
  static contact_pagedetail_delete = async (req, res) => {
    try {
      // console.log("hello")
      const id = req.params.id;
      const result = await contactPagedetailModel.findById(req.params.id);

      const image2Id = result.contact_banner.public_id;
      await cloudinary.uploader.destroy(image2Id);

      const data = await contactPagedetailModel.findByIdAndDelete(id);
      res.status(201).json({
        message: "data deleted sucessfully!",
        deletedata: data,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Internal server error !",
      });
    }
  };
}
module.exports = contactController;
