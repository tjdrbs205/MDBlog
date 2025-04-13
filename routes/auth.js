const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { isLoggedIn } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

// 회원가입 관련 라우트
router.get("/register", authController.renderRegisterForm);
router.post("/register", asyncHandler(authController.register));

// 로그인 관련 라우트
router.get("/login", authController.renderLoginForm);
router.post("/login", asyncHandler(authController.login));
router.get("/logout", authController.logout);

// 비밀번호 찾기 관련 라우트
router.get("/forgot-password", authController.renderForgotPasswordForm);
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
// TODO: 비밀번호 재설정 라우트 추가

// 프로필 관련 라우트 (로그인 필요)
router.get("/profile", isLoggedIn, asyncHandler(authController.renderProfile));
router.post("/profile", isLoggedIn, asyncHandler(authController.updateProfile));

// 비밀번호 변경 라우트 (로그인 필요)
router.get(
  "/change-password",
  isLoggedIn,
  authController.renderChangePasswordForm
);
router.post(
  "/change-password",
  isLoggedIn,
  asyncHandler(authController.changePassword)
);

module.exports = router;
