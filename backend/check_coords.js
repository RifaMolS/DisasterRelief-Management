const mongoose = require("mongoose");
const Shelter = require("./model/sheltermodel");
const Hospital = require("./model/hospitalmodel");

const checkData = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/Disaster");
        const shelters = await Shelter.find();
        const hospitals = await Hospital.find();
        
        console.log("SHELTERS:");
        shelters.forEach(s => console.log(`${s.name}: ${JSON.stringify(s.location)}`));
        
        console.log("\nHOSPITALS:");
        hospitals.forEach(h => console.log(`${h.name}: ${JSON.stringify(h.location)}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
