const mongoose = require("mongoose");
const User = require("./model/usermodel");
const Notification = require("./model/notificationmodel");

const seedNotifications = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/Disaster");
        console.log("Seeding notifications...");

        const users = await User.find({ role: "User" });
        if (users.length === 0) {
            console.log("No users with role 'User' found. Skipping.");
            process.exit(0);
        }

        const sampleNotifications = [];
        users.forEach(user => {
            sampleNotifications.push(
                {
                    userId: user._id,
                    title: "GLOBAL ALERT: Monsoon Cyclone Mesh",
                    message: "Tactical data suggests high intensity rainfall in Northern Sector. Secure all assets and stay linked to node safety protocols.",
                    type: "Alert"
                },
                {
                    userId: user._id,
                    title: "SHELTER COORDINATES UPDATED",
                    message: "3 new relief nodes have been initialized within 5km of your last verified grid position.",
                    type: "System"
                },
                {
                    userId: user._id,
                    title: "COMMUNICATION PROTOCOL ACTIVE",
                    message: "Your identity signal has been synchronized with the nearest NGO volunteer unit.",
                    type: "Help"
                }
            );
        });

        await Notification.insertMany(sampleNotifications);
        console.log(`Successfully seeded ${sampleNotifications.length} notifications for ${users.length} users.`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedNotifications();














                                                                                                                                                                                                                                                                                                                      