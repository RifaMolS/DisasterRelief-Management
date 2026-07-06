const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional for NGO broad alerts
    isNGOAlert: { type: Boolean, default: false },
    status: { type: String, enum: ["Pending", "In Progress", "Pending Verification", "Completed", "Rejected", "Resolved"], default: "Pending" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Disaster" },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    verificationPhoto: { type: String }, // Base64 or URL for task completion proof
    completionDetails: { type: String }, // Details submitted by volunteer upon completion
    assignedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);
