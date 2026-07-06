const express = require("express");
const router = express.Router();
const authController = require("../controller/authcontroller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/counts", authController.getUsersCount);
router.get("/users", authController.getAllUsers);
router.get("/volunteers", authController.getVolunteers);
router.get("/ngos", authController.getNGOs);
router.get("/admins", authController.getAdmins);
router.get("/all-accounts", authController.getAllAccounts);
router.put("/approve/:id", authController.approveUser);
router.get("/profile/:id", authController.getUserProfile);
router.put("/profile/:id", authController.updateProfile);

module.exports = router;
