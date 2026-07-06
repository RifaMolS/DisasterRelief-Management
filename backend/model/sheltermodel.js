const mongoose = require("mongoose");

const ShelterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    capacity: { type: Number },
    occupied: { type: Number, default: 0 },
    contact: { type: String },
    amenities: [String], // Food, Medical, Beds, etc.
    status: { type: String, enum: ["Open", "Full", "Closed"], default: "Open" }
}, { timestamps: true });

module.exports = mongoose.model("Shelter", ShelterSchema);
