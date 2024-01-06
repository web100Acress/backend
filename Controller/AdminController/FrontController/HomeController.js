//home controller  for handling operations routing 

const otherPropertyModel = require("../../../models/otherProperty/otherpropertyModel");
const buyCommercial_Model = require("../../../models/property/buyCommercial")
const rent_Model = require("../../../models/property/rent")
// const prelaunchModel=require("..")
const prelaunchModel = require('../../../models/newlaunch/prelaunch');
const ProjectModel = require("../../../models/projectDetail/project");



class homeController {

  // search in buy and rent 
  static search = async (req, res) => {
    const searchTerm = req.params.key;

    if (searchTerm.length) {
      const words = searchTerm.split(' ');
      const searchdata = []

      try {

        for (let i = 0; i < words.length; i++) {

          let data = await buyCommercial_Model.find(
            {
              "$or": [
                { "projectName": { $regex: words[i], $options: 'i' } },
                { "propertyTitle": { $regex: words[i], $options: 'i' } },
                { "address": { $regex: words[i], $options: 'i' } }
              ]
            }
          )

          let data2 = await rent_Model.find(
            {
              "$or": [
                { "projectName": { $regex: words[i], $options: 'i' } },
                { "propertyTitle": { $regex: words[i], $options: 'i' } },
                { "address": { $regex: words[i], $options: 'i' } },
                { "type": { $regex: words[i], $options: 'i' } }
              ]
            }
          )
          let data3 = await prelaunchModel.find(
            {
              "$or": [
                { "projectName": { $regex: words[i], $options: "i" } },
                { "city": { $regex: words[i], $options: "i" } },
                { "builderName": { $regex: words[i], $options: "i" } }
              ]
            }
          )

          const getdata = [...data2, ...data, ...data3]
          if (getdata.length > 0) {
            searchdata.push(...getdata)
          }
        }

        if (searchdata.length > 0) {
          res.status(200).json({
            message: "data found ! .",
            searchdata
          })
        } else {
          res.status(200).json({
            message: "data not found !!",

          })
        }

      } catch (error) {
        console.log(error)
      }
    } else {
      res.status(200).json({
        message: "Please inter your query! "
      })
    }
  }
  //search for otherproperty 
  static search_other = async (req, res) => {
    const { query } = req.query
    console.log(query)
    //   console.log(query)
    if (query.length) {
      const words = query.split(' ');
      const searchData = [];
      try {

        // Split the query into an array of words
        for (let i = 0; i < words.length; i++) {
          let data = await otherPropertyModel.find(
            {
              "$or": [
                { "propertyName": { $regex: words[i], $options: 'i' } },
                { "propertyType": { $regex: words[i], $options: 'i' } },
                { "address": { $regex: words[i], $options: 'i' } }
              ]
            }
          )
          if (data.length > 0) {
            searchData.push(...data);
          }
        }
        if (searchData.length > 0) {
          res.status(200).json({
            message: "Data found!",
            data: searchData
          });
        } else {
          res.status(200).json({
            message: "Data not found!"
          });
        }
      } catch (error) {
        console.log(error)
        res.status(500).json({
          message: "internal server error ! "
        })
      }
    }
  }
  //search in rental property
  static search_rent = async (req, res) => {
    // console.log("heloo")
    // console.log("listening the search rent ! ")
    const { query } = req.query
    const words = query.split(" ")
    // console.log(words)
    try {
      for (let i = 0; i < words.length; i++) {
        // console.log(words[i])
        const data = await rent_Model.find(
          {
            "$or": [
              { "projectName": { $regex: words[i], $options: 'i' } },
              { "propertyTitle": { $regex: words[i], $options: 'i' } },
              { "address": { $regex: words[i], $options: 'i' } },
              { 'type': { $regex: words[i], $options: 'i' } }
            ]
          }
        )
        // console.log(data)
        const searchData = [];
        if (data.length > 0) {
          searchData.push(...data)
        }
      }

      if (searchData.length > 0) {
        res.status(200).json({
          message: "data found ! ",
          searchData
        })
      } else {
        res.status(200).json({
          message: "data not found ! "
        })

      }

    }
    catch (error) {
      console.log(error)
      res.status(500).json({
        message: "Internal server error ! "
      })
    }
  }
  //search in buy property
  static search_buy = async (req, res) => {
    const { query } = req.body
    // console.log(query)
    const words = query.split(" ")
    try {
      console.log(words)
      for (let i = 0; i < words.length; i++) {
        const data = await buyCommercial_Model.find(
          {
            "$or": [
              { "city": { $regex: words[i], $options: 'i' } },
              { "state": { $regex: words[i], $options: 'i' } },
              { "type": { $regex: words[i], $options: 'i' } },
              { "projectName": { $regex: words[i], $options: 'i' } }
            ]
          }
        )
        const searchData = []

        if (data.length > 0) {
          searchData.push(...data)
        }
        if (searchData.length > 0) {
          res.status(200).json({
            message: "data found ! ",
            searchData
          })
        } else {
          res.status(200).json({
            message: " data not found ,search again ! "
          })
        }
      }

    }

    catch (error) {
      res.status(500).json({
        message: "Internal server error ! "
      })
    }
  }

  // filter data by projectname, city,buildername,minPrice,maxprice
  //type=== resident or commercial
  //area or state 
  // furnishing === select box fully or semi furnished 

  static filter_data = async (req, res) => {
    try {

      const { projectName, city,
        builderName, minPrice, maxPrice, state, area, type, furnishing } = req.query;
      // console.log(projectName,city,builderName)
      
      const filter_data = []
      const query = {};
      //  filter according the state
      if (state) {
        query.state = { $regex: new RegExp(state, 'i') }
      }
      //filter according the area 
      if (area) {
        query.area = { $regex: new RegExp(area, 'i') }
      }
      //filter according the type
      if (type) {
        query.type = { $regex: new RegExp(type, 'i') }
      }
      //filter according the furnishing 
      if (furnishing) {
        query.furnishing = { $regex: new RegExp(furnishing, 'i') }
      }
      if (projectName) {
        query.projectName = { $regex: new RegExp(projectName, 'i') };
      }
      if (city) {
        query.city = { $regex: new RegExp(city, 'i') };
      }
      // if selected buildrname
      if (builderName) {
        query.builderName = { $regex: new RegExp(builderName, 'i') }
      }

      //for less tha price or greater than price filter
      if (minPrice != 0) {
        const price = minPrice;
        if (price) {
          query.price = { $gte: parseInt(price) }
        }
      }
      if (maxPrice != 0) {
        const price = maxPrice
        if (price) {
          query.price = { $lte: parseInt(price) }
        }
      }

      // if selected both minPrice and maxPrice then excute this portion 
      if (minPrice && maxPrice) {
        if (minPrice != 0 || maxPrice != 0) {
          query.price = {};

          if (minPrice != 0) {
            const price = maxPrice
            if (price) {
              query.price.$lte = parseInt(price)
            }

          }

          if (maxPrice != 0) {
            const price = minPrice
            if (price) {
              query.price.$gte = parseInt(price)
            }
          }
        }
      }

      // if query is get 
      if (query) {
        const buy = await buyCommercial_Model.find(query)
        const items1 = await rent_Model.find(query);
        const items = await prelaunchModel.find(query);

        const data = [...items, ...items1, ...buy]

        if (data.length > 0) {
          filter_data.push(...data)
        }
        res.status(200).json({
          message: "data filtered",
          filter_data
        })
      } else {
        res.status(403).json({
          message: "please select field for filter data !"
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "internal server error "
      })
    }
  }



  // ///////////////////

  static join=async(req,res)=>{
  console.log("hello")
  const projectName = req.body.projectName;
    const state = req.body.state;

    const result = await prelaunchModel.aggregate([
      {
        $lookup: {
          from: "ProjectModel", // Assuming "ProjectModel" is the name of the collection
          localField: "projectName", // Field from prelaunchModel
          foreignField: "state", // Field from ProjectModel
          as: "joinedData"
        }
      },
      {
        $match: {
          $and: [
            { "projectName": projectName },
            { "state": state }
          ]
        }
      }
    ]);
    res.json(result);
  }

}
module.exports = homeController

