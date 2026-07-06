const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Optional: null = Global Mesh
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
