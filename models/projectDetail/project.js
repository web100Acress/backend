const mongoose = require("mongoose");

const bhk_Schema = new mongoose.Schema({
  bhk_type: {
    type: String, //1/2/3bhk
  },
  price: {
    type: String,
  },
  bhk_Area: {
    type: String,
  },
});

const highlight_Schema = new mongoose.Schema({
  highlight_Point: {
    type: String,
  },
});

const projectSchema = new mongoose.Schema(
  {
    project_floorplan_Image: [],
    frontImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    logo: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    project_locationImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    state: {
      type: String,
    },
    projectName: {
      type: String,
    },
    projectAddress: {
      type: String,
    },
    project_discripation: {
      type: String,
    },
    projectRedefine_Connectivity: [
      {
        type: String,
      },
    ],
    projectRedefine_Entertainment: [
      {
        type: String,
      },
    ],
    projectRedefine_Business: [
      {
        type: String,
      },
    ],
    projectRedefine_Education: [
      {
        type: String,
      },
    ],

    meta_description: {
      type: String,
    },
    meta_title: {
      type: String,
    },

    Amenities: [{ type: String }],
    projectBgContent: {
      type: String,
    },
    projectReraNo: {
      type: String,
    },
    type: {
      type: String,
    },
    city: {
      type: String,
    },
    builderName: {
      type: String,
    },
    AboutDeveloper: {
      type: String,
    },
    projectOverview: {
      type: String,
    },
    project_Brochure: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    project_Status: {
      type: String,
    },
    schema_type: {
      type: String,
      default: "project",
    },
    project_url: {
      type: String,
    },
    BhK_Details: [bhk_Schema],
    highlight: [highlight_Schema],

    highlightImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    projectMaster_plan:{
        public_id: {
            type: String,
          },
          url: {
            type: String,
          },
    },
    projectGallery: [],
    towerNumber: {
      type: Number
    },
    totalUnit: {
      type: Number
    },
    totalLandArea: {
      type: Number
    },
    launchingDate: {
       type: Date 
    },
    mobileNumber: {
      type: Number
    },
    possessionDate: {
       type: Date 
    },
    minPrice: {
      type: Number
    },
    maxPrice: {
      type: Number
    }
  },

  {
    timestamps: true,
  }
);

const ProjectModel = mongoose.model("projectData", projectSchema);
module.exports = ProjectModel;
