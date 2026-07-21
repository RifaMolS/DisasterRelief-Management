const Task = require("../model/taskmodel");
const User = require("../model/usermodel");
const Notification = require("../model/notificationmodel");
const Disaster = require("../model/disastermodel");

exports.createTask = async (req, res) => {
    try {
        const { title, description, volunteerId, priority, isNGOAlert, incidentId, requestId, allocatedResources } = req.body;
        
        // Handle potential string boolean from some client environments
        const isNGO = isNGOAlert === true || isNGOAlert === 'true';

        let assignedResourceIds = [];
        
        if (allocatedResources && Array.isArray(allocatedResources)) {
            const Resource = require("../model/resourcemodel");
            for (let item of allocatedResources) {
                const orig = await Resource.findById(item.originalId);
                if (orig && orig.quantity >= item.quantityToAllocate && item.quantityToAllocate > 0) {
                    orig.quantity -= item.quantityToAllocate;
                    if (orig.quantity === 0) orig.status = "Used";
                    await orig.save();
                    
                    const allocatedChunk = new Resource({
                        type: orig.type,
                        quantity: item.quantityToAllocate,
                        ngoId: orig.ngoId,
                        location: orig.location,
                        expiryDate: orig.expiryDate,
                        status: "Allocated"
                    });
                    await allocatedChunk.save();
                    assignedResourceIds.push(allocatedChunk._id);
                }
            }
        }

        const newTask = new Task({ 
          title, 
          description, 
          volunteerId: isNGO ? null : volunteerId, 
          priority,
          isNGOAlert: isNGO,
          incidentId,
          requestId,
          resources: assignedResourceIds
        });
        
        console.log("Processing task/alert payload:", { title, isNGO, incidentId });
        await newTask.save();
        
        // ... (rest of notification logic)
        if (isNGO) {
            // Notify all Admins — they need to assign a volunteer urgently
            const admins = await User.find({ role: "Admin" });
            if (admins.length > 0) {
                const adminNotifications = admins.map(admin => ({
                    userId: admin._id,
                    title: "🔶 NGO DEPLOY: Volunteer Needed — " + title,
                    message: `An NGO has committed assets and created a task that requires a volunteer to be dispatched. Please assign a volunteer immediately in the Task Dispatch Center.`,
                    type: "Alert"
                }));
                await Notification.insertMany(adminNotifications);
            }

            // Also notify all NGO users in the mesh (existing behaviour)
            const ngos = await User.find({ role: "NGO" });
            if (ngos.length > 0) {
                const ngoNotifications = ngos.map(ngo => ({
                    userId: ngo._id,
                    title: "STRATEGIC ALERT: " + title,
                    message: description,
                    type: "Alert"
                }));
                await Notification.insertMany(ngoNotifications);
            }
        } else if (volunteerId) {
            await User.findByIdAndUpdate(volunteerId, { status: "Busy" });
            const notification = new Notification({
                userId: volunteerId,
                title: "MISSION ASSIGNED: " + title,
                message: description,
                type: "Task"
            });
            await notification.save();
        }


        res.status(201).json({ message: isNGO ? "Authorities notified across mesh" : "Task assigned and synchronized" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate("volunteerId", "name email role")
            .populate("incidentId")
            .populate("resources")
            .populate({
                path: 'requestId',
                populate: { path: 'victimId', select: 'name contact location' }
            });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getVolunteerTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ volunteerId: req.params.volunteerId })
            .populate("incidentId")
            .populate("resources")
            .populate({
                path: 'requestId',
                populate: { path: 'victimId', select: 'name contact location' }
            });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const updateData = req.body;
        const { status, adminFeedback, volunteerId: newVolunteerId } = updateData;

        // Fetch the ORIGINAL task before update so we can detect volunteer assignment change
        const originalTask = await Task.findById(req.params.id);
        const wasUnassigned = !originalTask.volunteerId;

        const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate("volunteerId", "name email")
            .populate("incidentId");

        // ── NGO ALERT: Admin assigned a volunteer to an incident-linked task ──
        // Trigger when: task now has a volunteer, it previously didn't, and it's linked to an incident
        if (newVolunteerId && wasUnassigned && task.incidentId) {
            const ngos = await User.find({ role: "NGO" });
            const incidentType = task.incidentId?.type || "Disaster";
            const volunteerName = task.volunteerId?.name || "A volunteer";
            const incidentAddr = task.incidentId?.address || "GPS Verified Location";

            if (ngos.length > 0) {
                const ngoAlerts = ngos.map(ngo => ({
                    userId: ngo._id,
                    title: `✅ VOLUNTEER DISPATCHED: ${incidentType} Response`,
                    message: `Admin has assigned ${volunteerName} to the "${task.title}" deployment task for the ${incidentType} incident at ${incidentAddr}. Track progress in Incident Analysis.`,
                    type: "Alert"
                }));
                await Notification.insertMany(ngoAlerts);
            }

            // Also notify the newly assigned volunteer
            await new Notification({
                userId: newVolunteerId,
                title: "MISSION ASSIGNED: " + task.title,
                message: task.description || "You have been assigned to a disaster response mission. Please check task details.",
                type: "Task"
            }).save();
        }

        // ── Notify volunteer if task is rejected ──
        if (status === "Rejected" && task.volunteerId) {
            await new Notification({
                userId: task.volunteerId._id,
                title: "TASK VERIFICATION FAILED: " + task.title,
                message: adminFeedback || "Your submitted photo did not pass verification. Please re-check the task requirements.",
                type: "Alert"
            }).save();
        }

        // ── Notify Admins/NGO when volunteer submits completion photo ──
        if (status === "Completed" && updateData.verificationPhoto) {
            const validators = await User.find({ role: { $in: ["Admin", "NGO"] } });
            const notifications = validators.map(v => ({
                userId: v._id,
                title: "TASK COMPLETED: " + task.title,
                message: "A volunteer has submitted photo proof for task completion. Please audit it.",
                type: "System"
            }));
            await Notification.insertMany(notifications);
        }

        // ── NGO ALERT: Task resolved by admin (incident mission complete) ──
        if (status === "Resolved" && task.incidentId) {
            const ngos = await User.find({ role: "NGO" });
            const incidentType = task.incidentId?.type || "Disaster";
            if (ngos.length > 0) {
                const resolvedAlerts = ngos.map(ngo => ({
                    userId: ngo._id,
                    title: `🏁 MISSION RESOLVED: ${incidentType} Response Complete`,
                    message: `The deployment task "${task.title}" has been verified and resolved by Admin. The ${incidentType} incident has been marked as RESCUED.`,
                    type: "System"
                }));
                await Notification.insertMany(resolvedAlerts);
            }
        }

        // ── AUTO-RESOLVE: If task completed and linked to a disaster, mark disaster as RESCUED ──
        if (status === "Completed" && task.incidentId) {
            await Disaster.findByIdAndUpdate(task.incidentId, { status: "Rescued" });
            console.log(`Tactical Success: Linked disaster signal ${task.incidentId} marked as RESCUED.`);
        }

        // ── SOS SYNC: If task completed and linked to an SOS Request, mark Request as Rescued ──
        if (status === "Completed" && task.requestId) {
            const Request = require("../model/requestmodel");
            await Request.findByIdAndUpdate(task.requestId, { status: "Rescued" });
            console.log(`SOS Mesh Sync: Linked SOS request ${task.requestId} marked as RESCUED.`);
        }

        // Update volunteer availability status based on assignment and task progress
        if (newVolunteerId && (!originalTask.volunteerId || originalTask.volunteerId.toString() !== newVolunteerId.toString())) {
            await User.findByIdAndUpdate(newVolunteerId, { status: "Busy" });
            if (originalTask.volunteerId) {
                await User.findByIdAndUpdate(originalTask.volunteerId, { status: "Available" });
            }
        }
        if ((status === "Completed" || status === "Resolved") && originalTask.volunteerId) {
            await User.findByIdAndUpdate(originalTask.volunteerId, { status: "Available" });
        } else if (status === "Rejected" && originalTask.volunteerId) {
            await User.findByIdAndUpdate(originalTask.volunteerId, { status: "Busy" });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task && task.volunteerId) {
            await User.findByIdAndUpdate(task.volunteerId, { status: "Available" });
        }
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Haversine formula to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
};

exports.autoAssignNearest = async (req, res) => {
    try {
        const { taskId } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        let taskLat, taskLng;

        if (task.incidentId) {
            const disaster = await Disaster.findById(task.incidentId);
            if (disaster && disaster.location && disaster.location.coordinates && disaster.location.coordinates.length === 2) {
                taskLng = disaster.location.coordinates[0];
                taskLat = disaster.location.coordinates[1];
            }
        } else if (task.requestId) {
            const Request = require("../model/requestmodel");
            const request = await Request.findById(task.requestId);
            if (request && request.location) {
                taskLat = request.location.lat;
                taskLng = request.location.lng;
            }
        }

        if (!taskLat || !taskLng) {
            return res.status(400).json({ message: "Task has no valid coordinates for auto-assignment." });
        }

        // Query available volunteers
        const volunteers = await User.find({ role: "Volunteer", status: "Available", isApproved: true });
        
        let nearestVolunteer = null;
        let minDistance = Infinity;

        for (const volunteer of volunteers) {
            if (volunteer.coordinates && volunteer.coordinates.lat && volunteer.coordinates.lng) {
                const dist = getDistance(taskLat, taskLng, volunteer.coordinates.lat, volunteer.coordinates.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestVolunteer = volunteer;
                }
            }
        }

        // Fallback: If no volunteer has coordinates, take the first available
        if (!nearestVolunteer && volunteers.length > 0) {
            nearestVolunteer = volunteers[0];
        }

        if (!nearestVolunteer) {
            return res.status(404).json({ message: "No available volunteers found." });
        }

        // Assign task
        task.volunteerId = nearestVolunteer._id;
        await task.save();

        // Notify the volunteer
        const notification = new Notification({
            userId: nearestVolunteer._id,
            title: "URGENT AUTO-ASSIGNMENT: " + task.title,
            message: "You have been dispatched to the nearest emergency: " + task.description,
            type: "Task"
        });
        await notification.save();

        // Update volunteer status
        nearestVolunteer.status = "Busy";
        await nearestVolunteer.save();

        res.json({ 
            message: "Successfully assigned to nearest available responder.", 
            task, 
            volunteer: nearestVolunteer.name, 
            distance: minDistance === Infinity ? 'Unknown' : minDistance.toFixed(2) + ' km' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
