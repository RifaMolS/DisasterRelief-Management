const express = require("express");
const router = express.Router();
const resourceController = require("../controller/resourcecontroller");

router.post("/", resourceController.addResource);
router.get("/", resourceController.getResources);
router.put("/:id", resourceController.updateResource);
router.delete("/:id", resourceController.deleteResource);
router.get("/summary", resourceController.getResourceSummary);

module.exports = router;
