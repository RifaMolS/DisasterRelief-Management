const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Food, Water, Medicine, Tents
    quantity: { type: Number, required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: { type: String },
    expiryDate: { type: Date },
    status: { type: String, enum: ["In Stock", "Allocated", "Collected", "Used", "Expired"], default: "In Stock" }
}, { timestamps: true });

module.exports = mongoose.model("Resource", ResourceSchema);
