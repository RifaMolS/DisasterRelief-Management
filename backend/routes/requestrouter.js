const express = require("express");
const router = express.Router();
const requestController = require("../controller/requestcontroller");

router.post("/", requestController.createRequest);
router.get("/", requestController.getRequests);
router.get("/history/:userId", requestController.getUserHistory);
router.put("/:id", requestController.updateRequest);
router.delete("/:id", requestController.deleteRequest);
router.get("/counts", requestController.getRequestsCount);

module.exports = router;
