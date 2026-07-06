const express = require("express");
const router = express.Router();
const messageController = require("../controller/messagecontroller");

router.post("/", messageController.sendMessage);
router.get("/", messageController.getMessages);
router.delete("/clear", messageController.clearMessages);

module.exports = router;
