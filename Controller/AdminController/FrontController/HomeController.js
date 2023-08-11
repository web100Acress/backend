//home controller  for handling operations routing 

class homeController {

  // home method 
    static home = (req, res) => {
        res.send('home page controller ')
        console.log('helo')
    }
   
 // about method 
    static about=(req,res)=>{

        res.send('About page controller api listen')
    }

 // agent method 
    static agent=(req,res)=>{
        res.send('Agent page controller api listen')
    }

 // blog method 
    static blog=(req,res)=>{
        res.send('blop page controller api listen')
    }


 // contact method 
    static contact=(req,res)=>{
        res.send('contact page controlller api listen')
    }
}

module.exports = homeController