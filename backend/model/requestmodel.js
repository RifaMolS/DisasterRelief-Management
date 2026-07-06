const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
    victimId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    disasterId: { type: mongoose.Schema.Types.ObjectId, ref: "Disaster" },
    helpType: { type: String, required: true }, // Rescue, Food, First-Aid, etc.
    description: { type: String },
    location: {
        address: { type: String },
        lat: { type: Number },
        lng: { type: Number }
    },
    urgency: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // NGO or individual volunteer
}, { timestamps: true });

module.exports = mongoose.model("Request", RequestSchema);
