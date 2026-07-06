const express = require("express");
const router = express.Router();
const disasterController = require("../controller/disastercontroller");

router.post("/", disasterController.reportDisaster);
router.get("/", disasterController.getDisasters);
router.put("/:id", disasterController.updateDisaster);
router.delete("/:id", disasterController.deleteDisaster);
router.get("/counts", disasterController.getDisastersCount);
router.put("/sync/:id", disasterController.syncDisaster);
router.post("/broadcast", disasterController.broadcastAlert);

module.exports = router;
