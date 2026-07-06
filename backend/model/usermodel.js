const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "User", "Volunteer", "NGO"], default: "User" },
    contact: { type: String },
    location: { type: String }, // General location/address
    coordinates: { lat: Number, lng: Number }, // For intelligent volunteer assignment
    age: { type: Number, min: 18 },
    gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
    skills: [{ type: String }],
    experience: { type: String },
    emergencyContact: { type: String },
    status: { type: String, enum: ["Available", "Busy", "Inactive"], default: "Available" }, // For volunteers
    isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
