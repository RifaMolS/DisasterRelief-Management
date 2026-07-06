const Resource = require("../model/resourcemodel");

const isFood = (type = "") => type.toLowerCase().includes("food");
const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());
const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) <= new Date();

exports.addResource = async (req, res) => {
    try {
        const { type, quantity, ngoId, location, expiryDate } = req.body;
        if (isFood(type) && !expiryDate) {
            return res.status(400).json({ message: "Expiry date is required for food supplies." });
        }
        if (isFood(type) && !isValidDate(expiryDate)) {
            return res.status(400).json({ message: "Provide a valid food expiry date." });
        }
        if (isFood(type) && isExpired(expiryDate)) {
            return res.status(400).json({ message: "Expired food cannot be added for victim distribution." });
        }
        const newResource = new Resource({ type, quantity, ngoId, location, expiryDate: isFood(type) ? expiryDate : undefined });
        await newResource.save();
        res.status(201).json({ message: "Resource added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getResources = async (req, res) => {
    try {
        await Resource.updateMany(
            { expiryDate: { $lte: new Date() }, status: { $nin: ["Expired", "Used"] } },
            { status: "Expired" }
        );
        // Exclude 'Allocated' task chunks from cluttering the main inventory
        const resources = await Resource.find({ status: { $ne: "Allocated" } }).populate("ngoId", "name email");
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: "Resource record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateResource = async (req, res) => {
    try {
        const existing = await Resource.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Resource not found" });
        if (isFood(existing.type) && isExpired(existing.expiryDate) && req.body.status && req.body.status !== "Expired") {
            return res.status(400).json({ message: "Expired food cannot be allocated or distributed." });
        }
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(resource);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getResourceSummary = async (req, res) => {
    try {
        const totalResources = await Resource.countDocuments({ status: { $ne: "Expired" } });
        res.json({ totalResources });
    } catch (err) {
         res.status(500).json({ error: err.message });
    }
};
