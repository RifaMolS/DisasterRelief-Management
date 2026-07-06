const mongoose = require("mongoose");
const User = require("./model/usermodel");
const Resource = require("./model/resourcemodel");
const Shelter = require("./model/sheltermodel");
const Hospital = require("./model/hospitalmodel");
const Disaster = require("./model/disastermodel");
const Request = require("./model/requestmodel");
const Task = require("./model/taskmodel");

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const upsert = (Model, filter, data) => Model.findOneAndUpdate(
    filter,
    { $set: data },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

async function seedSampleData() {
    await mongoose.connect("mongodb://localhost:27017/Disaster");
    console.log("Connected to MongoDB. Loading sample project data...");

    const [ngo, volunteer, victim] = await Promise.all([
        User.findOne({ role: "NGO" }),
        User.findOne({ role: "Volunteer", isApproved: true }),
        User.findOne({ role: "User" })
    ]);

    const missingRoles = [
        !ngo && "an NGO",
        !volunteer && "an approved Volunteer",
        !victim && "a User"
    ].filter(Boolean);

    if (missingRoles.length > 0) {
        throw new Error(`Existing user data is required. Add ${missingRoles.join(", ")} before running the sample-data seed.`);
    }

    const resourceSamples = [
        { type: "Food Supply", quantity: 450, location: "Kochi Warehouse A", expiryDate: addDays(60), status: "In Stock" },
        { type: "Food Supply", quantity: 120, location: "Kochi Warehouse B", expiryDate: addDays(7), status: "In Stock" },
        { type: "Food Supply", quantity: 30, location: "Quarantine Rack", expiryDate: addDays(-5), status: "Expired" },
        { type: "Water Resource", quantity: 1000, location: "Kochi Warehouse A", status: "In Stock" },
        { type: "Medical Axis", quantity: 250, location: "Mobile Medical Depot", status: "In Stock" },
        { type: "Tentage", quantity: 80, location: "Kochi Warehouse B", status: "Allocated" }
    ];

    for (const resource of resourceSamples) {
        await upsert(Resource, { type: resource.type, location: resource.location, ngoId: ngo._id }, {
            ...resource,
            ngoId: ngo._id
        });
    }

    const shelters = [
        {
            name: "Kochi Community Relief Shelter",
            address: "Marine Drive, Ernakulam, Kerala",
            location: { lat: 9.9816, lng: 76.2756 },
            capacity: 500,
            occupied: 180,
            contact: "04842220001",
            amenities: ["Food", "Beds", "Medical Service", "Charging"],
            status: "Open"
        },
        {
            name: "Alappuzha Flood Safety Camp",
            address: "Civil Station Road, Alappuzha, Kerala",
            location: { lat: 9.4981, lng: 76.3388 },
            capacity: 300,
            occupied: 300,
            contact: "04772220002",
            amenities: ["Food", "Water", "Blankets"],
            status: "Full"
        }
    ];

    for (const shelter of shelters) {
        await upsert(Shelter, { name: shelter.name }, shelter);
    }

    const hospitals = [
        {
            name: "Ernakulam Emergency Medical Center",
            address: "MG Road, Ernakulam, Kerala",
            location: { lat: 9.9728, lng: 76.2844 },
            contact: "04842221111",
            specialization: ["Emergency Trauma", "General Medicine"],
            emergencyServices: true,
            availableBeds: 35
        },
        {
            name: "Alappuzha District Relief Hospital",
            address: "Beach Road, Alappuzha, Kerala",
            location: { lat: 9.4905, lng: 76.3264 },
            contact: "04772221112",
            specialization: ["Emergency Care", "Pediatrics"],
            emergencyServices: true,
            availableBeds: 18
        }
    ];

    for (const hospital of hospitals) {
        await upsert(Hospital, { name: hospital.name }, hospital);
    }

    const disaster = await upsert(Disaster, {
        type: "Flood",
        address: "Kuttanad, Alappuzha, Kerala"
    }, {
        type: "Flood",
        description: "Rising water level has affected homes and local access roads.",
        severity: "High",
        location: { type: "Point", coordinates: [76.4130, 9.4416] },
        address: "Kuttanad, Alappuzha, Kerala",
        status: "Ongoing",
        reportedBy: victim._id,
        telemetry: { rainfall: 230, humidity: 91, water_level: 7.2 }
    });

    const request = await upsert(Request, {
        victimId: victim._id,
        helpType: "Food and Water"
    }, {
        victimId: victim._id,
        disasterId: disaster._id,
        helpType: "Food and Water",
        description: "Family of four requires safe drinking water and food supplies.",
        location: { address: "Kuttanad, Alappuzha", lat: 9.4416, lng: 76.4130 },
        urgency: "High",
        status: "In Progress",
        assignedTo: ngo._id
    });

    await upsert(Task, { title: "Deliver emergency food kit to Kuttanad" }, {
        title: "Deliver emergency food kit to Kuttanad",
        description: "Collect only non-expired food and drinking water from Kochi Warehouse A.",
        volunteerId: volunteer._id,
        status: "Pending",
        priority: "High",
        incidentId: disaster._id,
        requestId: request._id
    });

    console.log("Sample data loaded successfully.");
    console.log("No user documents were created or modified.");
    console.log(`Existing references used: NGO=${ngo.email}, Volunteer=${volunteer.email}, User=${victim.email}`);
}

seedSampleData()
    .catch((error) => {
        console.error("Sample data loading failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
