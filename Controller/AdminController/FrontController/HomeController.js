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
                { "address": { $regex: words[i], $options: 'i' } }
              ]
            }
          )
          const get = [...data2, ...data]



          if (get !== null) {
            res.send(get)

            break;
          } else {
            res.send("not found !")
            break;
          }
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

    const query = req.body.query;
    try {
      // Split the query into an array of words
      const queryWords = query.split(' ');

      // Create an array of regular expressions for each word
      const regexQueries = queryWords.map(word => ({ "propertyName": { $regex: word, $options: 'i' } }));

      // Combine the individual word queries with an OR operator
      const combinedQuery = { $or: regexQueries };

      // Use the combined query to search the database
      const data = await otherPropertyModel.find(combinedQuery);

      console.log(data);
      if (data.length>0) {
        res.status(200).json({
          message: "data found ! ",
          data
        })
      } else {
        res.status(200).json({
          message: "data not found ! ",
          data
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "internal server error ! "
      })
    }

  }
  //

}

module.exports = homeController