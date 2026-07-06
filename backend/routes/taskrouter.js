const express = require("express");
const router = express.Router();
const taskController = require("../controller/taskcontroller");

router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.get("/volunteer/:volunteerId", taskController.getVolunteerTasks);
router.put("/:id", taskController.updateTaskStatus);
router.delete("/:id", taskController.deleteTask);
router.post("/auto-assign", taskController.autoAssignNearest);

module.exports = router;
