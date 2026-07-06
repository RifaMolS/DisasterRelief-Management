const Shelter = require("../model/sheltermodel");

exports.getAllShelters = async (req, res) => {
    try {
        const shelters = await Shelter.find();
        res.json(shelters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addShelter = async (req, res) => {
    try {
        const newShelter = new Shelter(req.body);
        await newShelter.save();
        res.status(201).json(newShelter);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteShelter = async (req, res) => {
    try {
        await Shelter.findByIdAndDelete(req.params.id);
        res.json({ message: "Shelter deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
