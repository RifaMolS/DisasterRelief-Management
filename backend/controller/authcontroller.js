const User = require("../model/usermodel");

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, contact, location, age, gender, skills, experience, emergencyContact } = req.body;
        if (role === "NGO") {
            return res.status(403).json({ message: "NGO self-registration is closed. Contact the administrator." });
        }
        if (!["User", "Volunteer"].includes(role)) {
            return res.status(400).json({ message: "Invalid registration role." });
        }
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "User already exists" });

        if (role === "Volunteer") {
            if (!age || Number(age) < 18 || !gender || !emergencyContact || !Array.isArray(skills) || skills.length === 0) {
                return res.status(400).json({ message: "Complete all required volunteer details." });
            }
        }

        const isApproved = role === "User";
        const newUser = new User({
            name, email, password, role, contact, location, isApproved,
            ...(role === "Volunteer" ? { age, gender, skills, experience, emergencyContact } : {})
        });
        await newUser.save();
        res.status(201).json({ message: "Registration successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email, password }); // In production use bcrypt
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // SECURITY: Verify requested role matches actual database role
        if (role && user.role !== role) {
            return res.status(403).json({ 
                message: `AUTHENTICATION FAILURE: Identity-Role mismatch. You are registered as ${user.role}, but attempting access as ${role}.` 
            });
        }

        // Check for approval for high-privilege roles
        if ((user.role === "Volunteer" || user.role === "NGO") && !user.isApproved) {
            return res.status(403).json({ message: "Your account is pending admin approval. Access denied." });
        }

        res.status(200).json({ 
            message: "Login successful", 
            user: { id: user._id, name: user.name, role: user.role } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUsersCount = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalNGOs = await User.countDocuments({ role: "NGO" });
        const totalVolunteers = await User.countDocuments({ role: "Volunteer" });
        res.json({ totalUsers, totalNGOs, totalVolunteers });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "User" });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await User.find({ role: "Volunteer" });
        res.json(volunteers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getNGOs = async (req, res) => {
    try {
        const ngos = await User.find({ role: "NGO" });
        res.json(ngos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "Admin" });
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllAccounts = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User approved successfully", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, contact, location, status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { name, contact, location, status }, 
            { new: true }
        ).select("-password");
        
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Profile updated", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
