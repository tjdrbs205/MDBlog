const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { isLoggedIn, isNotLoggedIn } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");
const { imageUpload } = require("../utils/fileUpload");

/**
 * 로그인 관련 라우트
 */

// GET /auth/login - 로그인 페이지 렌더링
router.get("/login", isNotLoggedIn, authController.renderLogin);

// POST /auth/login - 로그인 처리
router.post(
  "/login",
  isNotLoggedIn,
  [
    body("email").isEmail().withMessage("유효한 이메일 주소를 입력해주세요.").normalizeEmail(),
    body("password").notEmpty().withMessage("비밀번호를 입력해주세요."),
    validationMiddleware,
  ],
  asyncHandler(authController.login)
);

// GET /auth/logout - 로그아웃 처리
router.get("/logout", isLoggedIn, authController.logout);

/**
 * 회원가입 관련 라우트
 */

// GET /auth/register - 회원가입 페이지 렌더링
router.get("/register", isNotLoggedIn, authController.renderRegister);

// POST /auth/register - 회원가입 처리
router.post(
  "/register",
  isNotLoggedIn,
  [
    body("username")
      .notEmpty()
      .withMessage("사용자명을 입력해주세요.")
      .isAlphanumeric()
      .withMessage("사용자명은 영문과 숫자만 포함할 수 있습니다.")
      .isLength({ min: 3, max: 20 })
      .withMessage("사용자명은 3~20자 사이여야 합니다.")
      .trim(),
    body("email").isEmail().withMessage("유효한 이메일 주소를 입력해주세요.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("비밀번호는 최소 6자 이상이어야 합니다.").trim(),
    body("passwordConfirm").custom((value, { req }) => {
      console.log("비밀번호 확인:", value, req.body.password);
      if (value !== req.body.password) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }
      return true;
    }),
    validationMiddleware,
  ],
  asyncHandler(authController.register)
);

/**
 * 프로필 관련 라우트
 */

// GET /auth/profile - 프로필 페이지 렌더링
router.get("/profile", isLoggedIn, asyncHandler(authController.renderProfile));

// POST /auth/profile - 프로필 업데이트 처리
router.post(
  "/profile",
  isLoggedIn,
  [
    body("displayName")
      .notEmpty()
      .withMessage("표시 이름을 입력해주세요.")
      .isLength({ max: 50 })
      .withMessage("표시 이름은 최대 50자까지 가능합니다.")
      .trim(),
    body("bio")
      .optional({ nullable: true })
      .isLength({ max: 200 })
      .withMessage("자기소개는 최대 200자까지 가능합니다.")
      .trim(),
    body("website").optional({ nullable: true }).isURL().withMessage("유효한 웹사이트 URL을 입력해주세요.").trim(),
    validationMiddleware,
  ],
  asyncHandler(authController.updateProfile)
);

/**
 * 비밀번호 변경 관련 라우트
 */

// GET /auth/change-password - 비밀번호 변경 페이지 렌더링
router.get("/change-password", isLoggedIn, asyncHandler(authController.renderChangePassword));

// POST /auth/change-password - 비밀번호 변경 처리
router.post(
  "/change-password",
  isLoggedIn,
  [
    body("currentPassword").notEmpty().withMessage("현재 비밀번호를 입력해주세요.").trim(),
    body("newPassword").isLength({ min: 6 }).withMessage("새 비밀번호는 최소 6자 이상이어야 합니다.").trim(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("새 비밀번호가 일치하지 않습니다.");
      }
      return true;
    }),
    validationMiddleware,
  ],
  asyncHandler(authController.changePassword)
);

/**
 * 프로필 이미지 관련 라우트
 */

// POST /auth/profile/image - 프로필 이미지 업로드
router.post(
  "/profile/image",
  isLoggedIn,
  imageUpload.single("profileImage"),
  asyncHandler(authController.uploadProfileImage)
);

// POST /auth/profile/image/delete - 프로필 이미지 삭제
router.post(
  "/profile/image/delete",
  isLoggedIn,
  (req, res, next) => {
    console.log("프로필 이미지 삭제 라우트 도달:", req.path);
    console.log("요청 본문:", req.body);
    next();
  },
  asyncHandler(authController.deleteProfileImage)
);

module.exports = router;
