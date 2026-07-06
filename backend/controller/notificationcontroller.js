const mongoose = require("mongoose");
const Notification = require("../model/notificationmodel");

exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Fetching notifications for user:", userId);
        
        // Explicitly cast userId to ObjectId to ensure correct matching in the database
        const notifications = await Notification.find({ 
            userId: new mongoose.Types.ObjectId(userId) 
        }).sort({ createdAt: -1 });
        
        console.log(`Found ${notifications.length} notifications`);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        await Notification.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
        res.json({ message: "Notifications cleared" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
