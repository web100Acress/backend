//home controller  for handling operations routing 

class homeController {

  // home method 
    static home = (req, res) => {
        res.send('home page controller ')
        console.log('helo')
    }
   
//  // about method 
//     static about=(req,res)=>{

//         res.send('About page controller api listen')
//     }






}

module.exports = homeController