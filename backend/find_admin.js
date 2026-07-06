const mongoose = require("mongoose");
const User = require("./model/usermodel");

const findAdmin = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/Disaster");
        const admin = await User.findOne({ role: "Admin" });
        if (admin) {
            console.log("Admin User Found:");
            console.log(JSON.stringify(admin, null, 2));
        } else {
            console.log("No Admin user found.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error finding admin:", err);
        process.exit(1);
    }
};

findAdmin();
