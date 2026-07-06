const Disaster = require("../model/disastermodel");
const Notification = require("../model/notificationmodel");
const User = require("../model/usermodel");

exports.reportDisaster = async (req, res) => {
    try {
        const { type, description, severity, location, address, reportedBy } = req.body;
        const newDisaster = new Disaster({ type, description, severity, location, address, reportedBy });
        await newDisaster.save();

        // UNIFIED MESH BROADCAST: Notify Admins, NGOs, and Volunteers
        const notificationRecipients = await User.find({ 
            $or: [
                { role: "Admin" },
                { role: { $in: ["NGO", "Volunteer"] }, isApproved: true }
            ]
        });

        const notificationPromises = notificationRecipients.map(recipient => {
            return new Notification({
                userId: recipient._id,
                title: `🚨 CRITICAL SIGNAL: ${type}`,
                message: `URGENT: ${type} reported at ${address || "Coordinates captured"}. [Severity: ${severity}]. Immediate situational awareness required.`,
                type: "Alert"
            }).save();
        });
        await Promise.all(notificationPromises);

        res.status(201).json({ message: "Disaster reported successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDisasters = async (req, res) => {
    try {
        const { userId, role } = req.query;
        let query = {};
        
        if (role === 'User' && userId) {
            query.reportedBy = userId;
        }

        const disasters = await Disaster.find(query).populate("reportedBy", "name email");
        res.json(disasters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDisaster = async (req, res) => {
    try {
        const updateData = req.body;
        const oldDisaster = await Disaster.findById(req.params.id);
        const disaster = await Disaster.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        // NOTIFICATION FEEDBACK LOOP: Notify the original reporter when status changes
        if (disaster.reportedBy && updateData.status && updateData.status !== oldDisaster.status) {
            let title = "";
            let message = "";

            if (disaster.status === "Ongoing") {
                title = `ACTIVATE: Help is on the way`;
                message = `Your reported ${disaster.type} at ${disaster.address || "your location"} is now being actively handled by our tactical units.`;
            } else if (disaster.status === "Resolved" || disaster.status === "Rescued") {
                title = `MISSION SUCCESS: Incident Resolved`;
                message = `The ${disaster.type} situation you reported has been officially RESOLVED. Thank you for your vigilance.`;
            }

            if (title) {
                await new Notification({
                    userId: disaster.reportedBy,
                    title,
                    message,
                    type: "Alert"
                }).save();
                console.log(`Status update notification relayed to reporter: ${disaster.reportedBy}`);
            }
        }

        res.json(disaster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDisaster = async (req, res) => {
    try {
        await Disaster.findByIdAndDelete(req.params.id);
        res.json({ message: "Disaster record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDisastersCount = async (req, res) => {
    try {
        const totalAlerts = await Disaster.countDocuments();
        const activeAlerts = await Disaster.countDocuments({ status: { $ne: "Resolved" } });
        res.json({ totalAlerts, activeAlerts });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
};

exports.syncDisaster = async (req, res) => {
    try {
        const disaster = await Disaster.findById(req.params.id);
        if (!disaster) return res.status(404).json({ message: "Incident not found" });

        // Broadcast to NGO and Volunteers
        const volunteersAndNGOs = await User.find({ role: { $in: ["NGO", "Volunteer"] } });

        const notifications = volunteersAndNGOs.map(r => ({
            userId: r._id,
            title: `TACTICAL AUTHORIZATION: ${disaster.type}`,
            message: `Command Center has synchronized satellite coordinates for incident at ${disaster.address}. Deployment authorized.`,
            type: "System"
        }));

        // DIRECT BEACON TO VICTIM
        if (disaster.reportedBy) {
            notifications.push({
                userId: disaster.reportedBy,
                title: `SATELLITE POSITION LOCKED`,
                message: `Command has synchronized your coordinates via satellite mesh. Help is being prioritized for deployment.`,
                type: "Alert"
            });
        }

        await Notification.insertMany(notifications);

        res.json({ message: "Signal synchronized and volunteers notified." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.broadcastAlert = async (req, res) => {
    try {
        const { title, message, targetRoles, targetLocation } = req.body;
        let query = {};
        
        // Filter by role
        if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
            query.role = { $in: targetRoles };
        } else {
            query.role = "User";
        }

        // Filter by location if specified
        if (targetLocation && targetLocation.trim() !== '') {
            query.location = { $regex: targetLocation.trim(), $options: 'i' };
        }

        const recipients = await User.find(query);
        
        const notifications = recipients.map(u => ({
            userId: u._id,
            title: `GLOBAL ALERT: ${title}`,
            message: message,
            type: "Alert"
        }));
        
        await Notification.insertMany(notifications);
        res.json({ message: `Broadcast relayed to ${recipients.length} personnel.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
