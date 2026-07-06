const Message = require("../model/messagemodel");

exports.sendMessage = async (req, res) => {
    try {
        const { sender, senderName, senderRole, content, recipient } = req.body;
        const newMessage = new Message({ 
            sender, 
            senderName, 
            senderRole, 
            content, 
            recipient: recipient || null 
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { sender, recipient } = req.query;
        let query = {};

        if (sender && recipient) {
            // Private Direct Messaging: Explicitly cast to ObjectId for robust $or matching
            const mongoose = require('mongoose');
            const sId = new mongoose.Types.ObjectId(sender);
            const rId = new mongoose.Types.ObjectId(recipient);
            
            query = {
                $or: [
                    { sender: sId, recipient: rId },
                    { sender: rId, recipient: sId }
                ]
            };
        } else {
            // Global Mesh Broadcast
            query = { recipient: { $exists: false } }; // Fallback for old messages
            // Alternatively, if we want to be strict: query = { recipient: null };
            // Let's use a more robust check:
            query = { $or: [{ recipient: null }, { recipient: { $exists: false } }] };
        }

        const messages = await Message.find(query).sort({ createdAt: 1 }).limit(200);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearMessages = async (req, res) => {
    try {
        await Message.deleteMany({});
        res.json({ message: "Communication mesh cleared." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
