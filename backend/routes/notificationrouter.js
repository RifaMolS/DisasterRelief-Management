const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationcontroller");

router.get("/user/:userId", notificationController.getNotifications);
router.put("/read/:id", notificationController.markAsRead);
router.delete("/clear/:userId", notificationController.clearNotifications);

module.exports = router;
