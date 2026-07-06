const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    contact: { type: String },
    specialization: [String],
    emergencyServices: { type: Boolean, default: true },
    availableBeds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Hospital", HospitalSchema);
