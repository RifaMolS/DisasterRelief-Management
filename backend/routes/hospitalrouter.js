const express = require("express");
const router = express.Router();
const hospitalController = require("../controller/hospitalcontroller");

router.get("/", hospitalController.getAllHospitals);
router.post("/", hospitalController.addHospital);
router.delete("/:id", hospitalController.deleteHospital);

module.exports = router;
