const Request = require("../model/requestmodel");

exports.createRequest = async (req, res) => {
    try {
        const { victimId, disasterId, helpType, description, location, urgency = "High" } = req.body;
        const newRequest = new Request({ victimId, disasterId, helpType, description, location, urgency });
        await newRequest.save();

        // Proactive Notification for Admins/NGOs
        const Notification = require("../model/notificationmodel");
        const User = require("../model/usermodel");
        
        // Fetch victim name for the alert message
        const victim = await User.findById(victimId);
        const victimName = victim ? victim.name : "Unknown Citizen";

        // Notify both Admins and NGOs
        const notificationRecipients = await User.find({ role: { $in: ["Admin", "NGO"] } });
        
        const notifications = notificationRecipients.map(recipient => ({
            userId: recipient._id,
            title: `CRITICAL ALERT: New ${helpType} Signal`,
            message: `${urgency} priority extraction request received from ${victimName} at ${location?.address || 'GPS Coordinates Provided'}.`,
            type: "Help"
        }));
        await Notification.insertMany(notifications);

        res.status(201).json({ message: "Help request submitted successfully and alerts sent." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find()
        .populate("victimId", "name contact location")
        .populate("disasterId", "type location");
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (assignedTo) updateData.assignedTo = assignedTo;

        const oldRequest = await Request.findById(req.params.id);
        const request = await Request.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // NOTIFICATION: Notify victim when request is updated
        if (status && status !== oldRequest.status) {
            const Notification = require("../model/notificationmodel");
            let title = `SIGNAL UPDATE: ${request.helpType}`;
            let message = `Your request for ${request.helpType} has been updated to "${status}".`;

            if (status === "In Progress") {
                message = `GOOD NEWS: A response unit has been assigned to your ${request.helpType} request. Help is on the way.`;
            } else if (status === "Completed") {
                message = `MISSION SUCCESS: Your request for ${request.helpType} has been marked as COMPLETED. Stay safe.`;
            }

            await new Notification({
                userId: request.victimId,
                title,
                message,
                type: "Alert"
            }).save();
        }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        await Request.findByIdAndDelete(req.params.id);
        res.json({ message: "Request record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRequestsCount = async (req, res) => {
    try {
        const totalRequests = await Request.countDocuments();
        const pendingRequests = await Request.countDocuments({ status: "Pending" });
        res.json({ totalRequests, pendingRequests });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const Disaster = require("../model/disastermodel");
        const Task = require("../model/taskmodel");

        // Fetch disasters reported by the user
        const disasters = await Disaster.find({ reportedBy: userId }).sort({ createdAt: -1 });

        // Fetch rescue/help request entries, including potential disaster links
        const requests = await Request.find({ victimId: userId })
            .populate("disasterId", "type address severity")
            .sort({ createdAt: -1 });

        // Gather corresponding tasks linked to these requests
        const requestIds = requests.map(r => r._id);
        const tasks = await Task.find({ requestId: { $in: requestIds } })
            .populate("volunteerId", "name email contact")
            .populate("resources", "name type quantity");

        res.json({
            disasters,
            requests,
            tasks
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
