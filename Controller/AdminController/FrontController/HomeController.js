//home controller  for handling operations routing 

const otherPropertyModel = require("../../../models/otherProperty/otherpropertyModel");
const buyCommercial_Model = require("../../../models/property/buyCommercial")
const rent_Model = require("../../../models/property/rent")

class homeController {
  // search in buy and rent 
  static search = async (req, res) => {
    const searchTerm = req.params.key;

    if (searchTerm.length) {
      const words = searchTerm.split(' ');
      const searchdata=[]

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
          const getdata = [...data2, ...data]
          if(getdata.length>0){
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
      res.send("please enter search query")
    }
  }
  //search in otherproperty
  static search_other = async (req, res) => {
    const {query } = req.body
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
          }else{
            res.status(200).json({
              message: "Data not found!"
            });
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
      const searchData = [];
      for (let i = 0; i < words.length; i++) {
        // console.log(words[i])
        const data = await rent_Model.find(
          {
            "$or": [
              { "projectName": { $regex: words[i], $options: 'i' } },
              { "propertyTitle": { $regex: words[i], $options: 'i' } },
              { "address": { $regex: words[i], $options: 'i' } },
              { "type": { $regex: words[i], $options: 'i' } }
            ]
          }
        )
        // console.log(data)
        if (data.length > 0) {
          searchData.push(...data)
        }
      }
      // res.send(searchData)
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
        message: "internal server error ! "
      })
    }
  }
  //search in buy property
  static search_buy = async (req, res) => {
    const { query } = req.query
    // console.log(query)
    const words = query.split(" ")
    try {
      // console.log(words)
      const searchData = []
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
          message: "data not found !! "
        })
      }
    }
    catch (error) {
      res.status(500).json({
        message: "internal server error ! "
      })
    }
  }

}

module.exports = homeController

