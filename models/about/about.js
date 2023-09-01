const mongoose = require('mongoose')

const about_Schema = new mongoose.Schema({
    sliderImage: {
        public_id: {
            type: String,
        
        },
        url: {
            type: String,
       
        }
    },
    sliderHeading: {
        type: String,
        
    },
    sliderDescripation: {
        type: String,
    
    },

    aboutImage: {
        public_id: {
            type: String,
          
        },
        url: {
            type: String,
            
        }
    },
    aboutHeading: {
        type: String,
    
    },
    aboutDescripation: {
        type: String,
      
    },

    chooseImage: {
        public_id: {
            type: String,
       
        url: {
            type: String,
        
        }
    },
    chooseHeading: {
        type: String,
   
    },
    chooseDescripation: {
        type: String,
    
    },

 

},


})
const aboutModel = mongoose.model('AboutPage', about_Schema)
module.exports = aboutModel