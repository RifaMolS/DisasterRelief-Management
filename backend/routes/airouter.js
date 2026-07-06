const express = require("express");
const router = express.Router();
const aiController = require("../controller/aicontroller");

router.post("/predict", aiController.predictDisaster);
router.post("/predict/batch", aiController.predictBatch);

module.exports = router;
