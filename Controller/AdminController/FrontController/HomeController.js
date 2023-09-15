//home controller  for handling operations routing 

const buyCommercial_Model = require("../../../models/property/buyCommercial")
const rent_Model = require("../../../models/property/rent")

class homeController {

  // home method 
  static home = (req, res) => {
    res.send('home page controller ')
    console.log('helo')
  }

  //  search api 
//   static search = async (req, res) => {
//     // console.log("helllo")
//     const searchTerm = req.params.key;
//     console.log(searchTerm,"helo")
//     const { city, type } = req.body
//     // console.log(req.body)
//     // const joinedString = searchTerm.split(' ').join('');
//     // const words = searchTerm.split(' ');
//     // for(let i=1;i<2;i++){
//     // const lastWord = words[words.length - i];
//     // console.log(lastWord)}

//     const words = searchTerm.split(' ');

//     // for (const word of words) {
//     //   console.log(word);
//     // }




//     try {
//       for (let i = 0; i < words.length; i++) {

//         console.log(req.params.key,words[i])
//         let data = await buyCommercial_Model.find(
//           {
//             "$or": [
//               { "projectName": { $regex: words[i], $options: 'i' } },
//               { "propertyTitle": { $regex: words[i], $options: 'i' } },
//               { "address": { $regex: words[i], $options: 'i' } }
//             ]
//           }
//         )

//         let data2 = await rent_Model.find(
//           {
//             "$or": [
//               { "projectName": { $regex: words[i], $options: 'i' } },
//               { "propertyTitle": { $regex: words[i], $options: 'i' } },
//               { "address": { $regex: words[i], $options: 'i' } }
//             ]
//           }
//         )

//         const get = [...data2, ...data]
//         // const fliterdata = []
//         // console.log(fliterdata,"hello")
//         // get.forEach((property) => {
//         //   if (get.city == city && get.type == type) {
//         //     fliterdata.push(property)
//         //   }
//         // });
// console.log(get)

//         if (get !== null) {
//           res.send(get)

//           break;
//         }else{
//           res.send("not found !")
//           break;
//         }
//       }
//     } catch (error) {
//       console.log(error)
//     }

  // }

static search=async(req,res)=>{
  const searchTerm = req.params.key;

  if(searchTerm.length){
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
                        }else{
                          res.send("not found !")
                          break;
                        }
                      }
                    
  
  
} catch (error) {
    console.log(error)
  }
}else{
  res.send("please enter search query")
}
}


}

module.exports = homeController