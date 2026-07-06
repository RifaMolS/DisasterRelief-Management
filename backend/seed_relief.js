const mongoose = require("mongoose");
const Shelter = require("./model/sheltermodel");
const Hospital = require("./model/hospitalmodel");

const seedReliefNodes = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/Disaster");
        console.log("Seeding relief nodes...");

        // Clean existing
        await Shelter.deleteMany({});
        await Hospital.deleteMany({});

        const shelters = [
            { 
                name: "Central Rescue Hub Alpha", 
                address: "Flat 2, Sector 7, Block B, New Delhi", 
                location: { lat: 28.6139, lng: 77.2090 }, 
                contact: "+1-800-RESQ-001", 
                capacity: 500, 
                occupied: 120,
                amenities: ["Food", "Beds", "Medical Service"]
            },
            { 
                name: "West Perimeter Safe Zone", 
                address: "Outer Ring Road, West Delhi", 
                location: { lat: 28.6328, lng: 77.1131 }, 
                contact: "+1-800-SAFE-009", 
                capacity: 300, 
                occupied: 280,
                amenities: ["Water", "Charger Station"]
            },
            { 
                name: "Zion Temporary Shelter", 
                address: "Connaught Place, New Delhi", 
                location: { lat: 28.6304, lng: 77.2177 }, 
                contact: "+1-800-ZION-99", 
                capacity: 150, 
                occupied: 45,
                amenities: ["Security", "Blankets"]
            }
        ];

        const hospitals = [
            { 
                name: "Metro Medical Triage", 
                address: "Palam Road, Sector 10, New Delhi", 
                location: { lat: 28.5921, lng: 77.0460 }, 
                contact: "+1-911-METRO-1", 
                specialization: ["Emergency Trauma", "Surgery"],
                availableBeds: 45
            },
            { 
                name: "Saint Jude Relief Clinic", 
                address: "Karol Bagh, New Delhi", 
                location: { lat: 28.6508, lng: 77.1912 }, 
                contact: "+1-911-JUDE-2", 
                specialization: ["Primary Care", "Pediatrics"],
                availableBeds: 20
            },
            { 
                name: "Field Stabilizer Unit 9", 
                address: "Mobile Unit - North Sector", 
                location: { lat: 28.7041, lng: 77.1025 }, 
                contact: "+1-911-UNIT-9", 
                specialization: ["Mass Casualty", "Isolation"],
                availableBeds: 10
            }
        ];

        await Shelter.insertMany(shelters);
        await Hospital.insertMany(hospitals);

        console.log("Relief nodes seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err.stack);
        process.exit(1);
    }
};

seedReliefNodes();
