const express = require("express");
const router = express.Router();
const analyticsController = require("../controller/analyticscontroller");

router.get("/global", analyticsController.getGlobalAnalytics);

module.exports = router;
