const mongoose = require("mongoose");
const User = require("./model/usermodel");

const seedAdmin = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/Disaster");
        console.log("Seeding process started...");

        const adminExists = await User.findOne({ role: "Admin" });
        if (adminExists) {
            console.log("An admin profile is already registered. Skipping seeding.");
            process.exit(0);
        }

        const admin = new User({
            email: "admin@resqai.com",
            password: "admin123",
            role: "Admin"
        });

        await admin.save();
        console.log("Admin user seeded successfully with basic credentials!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding operation failed:", err);
        process.exit(1);
    }
};

seedAdmin();
