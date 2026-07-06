const mongoose = require("mongoose");

const DisasterSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Flood, Fire, Earthquake, etc.
    description: { type: String },
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" } // [longitude, latitude]
    },
    address: { type: String },
    status: { type: String, enum: ["Reported", "Ongoing", "Resolved", "Rescued"], default: "Reported" },
    telemetry: {
        rainfall: { type: Number, default: 0 },
        temperature: { type: Number, default: 0 },
        humidity: { type: Number, default: 0 },
        wind_speed: { type: Number, default: 0 },
        seismic_activity: { type: Number, default: 0 },
        water_level: { type: Number, default: 0 },
        soil_moisture: { type: Number, default: 0 },
        vegetation_index: { type: Number, default: 0 }
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Disaster", DisasterSchema);
