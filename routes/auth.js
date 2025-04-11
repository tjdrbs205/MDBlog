const express = require("express");
const router = express.Router();
const authController = require("../constroller/authController");

//form
router.get("/register", authController.renderNewUserForm);
router.post("/register", authController.register);
router.get("/login", authController.renderLoginForm);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
