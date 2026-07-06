const express = require("express");
const router = express.Router();
const shelterController = require("../controller/sheltercontroller");

router.get("/", shelterController.getAllShelters);
router.post("/", shelterController.addShelter);
router.delete("/:id", shelterController.deleteShelter);

module.exports = router;
