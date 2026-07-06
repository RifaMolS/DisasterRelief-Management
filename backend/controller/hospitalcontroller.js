const Hospital = require("../model/hospitalmodel");

exports.getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addHospital = async (req, res) => {
    try {
        const newHospital = new Hospital(req.body);
        await newHospital.save();
        res.status(201).json(newHospital);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteHospital = async (req, res) => {
    try {
        await Hospital.findByIdAndDelete(req.params.id);
        res.json({ message: "Hospital deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
