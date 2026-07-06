const Disaster = require("../model/disastermodel");
const Resource = require("../model/resourcemodel");
const Request = require("../model/requestmodel");
const User = require("../model/usermodel");

exports.getGlobalAnalytics = async (req, res) => {
    try {
        const [
            disasterStats,
            resourceStats,
            requestStats,
            userStats
        ] = await Promise.all([
            Disaster.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } }
            ]),
            Resource.aggregate([
                { $match: { status: { $ne: "Expired" } } },
                { $group: { _id: "$type", totalQuantity: { $sum: "$quantity" } } }
            ]),
            Request.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            counts: {
                disasters: disasterStats.reduce((a, b) => a + b.count, 0),
                resources: resourceStats.reduce((a, b) => a + b.totalQuantity, 0),
                requests: requestStats.reduce((a, b) => a + b.count, 0),
                users: userStats.reduce((a, b) => a + b.count, 0)
            },
            disasters: disasterStats,
            resources: resourceStats,
            requests: requestStats,
            users: userStats
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
