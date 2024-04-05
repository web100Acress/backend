const mongoose = require("mongoose")

const careerSchema = new mongoose.Schema({
    bannerImage: {
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    },
    activityImage: [],

    whyAcress: {

    },
    driveCulture: [],

    inHouse: [],

    lifeAcress: [],

    highlightImage: [],

}, {
    timestamps: true
})
const careerModal = mongoose.model("Career", careerSchema)
module.exports = careerModal