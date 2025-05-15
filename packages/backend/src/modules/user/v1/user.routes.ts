import { Router } from "express";
import UserController from "./user.controller";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";
import { body } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";
import { imageUpload } from "../../../common/utils/fileUpload.util";

const router = Router();
const userController = new UserController();

// GET
router.get("/logout", AuthenticationMiddleware.isNotLoggedIn, userController.logout); // /api/users/logout - 사용자 로그아웃
router.get("/refresh", userController.refreshToken); // /api/users/refresh - 리프레시 토큰 갱신

// POST
router.post(
  "/login",
  AuthenticationMiddleware.isNotLoggedIn,
  [
    body("email").isEmail().withMessage("유효하지 않는 이메일 형식 입니다."),
    body("password").notEmpty().withMessage("비밀번호를 입력해주세요."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(userController.login)
); // /api/users/login - 사용자 로그인
router.post(
  "/register",
  AuthenticationMiddleware.isNotLoggedIn,
  [
    body("username")
      .notEmpty()
      .withMessage("사용자 이름을 입력해주세요.")
      .isAlphanumeric()
      .withMessage("사용자 이름은 영문과 숫자만 가능합니다.")
      .isLength({ min: 2, max: 20 })
      .withMessage("사용자 이름은 2자 이상 20자 이하로 입력해주세요.")
      .trim(),
    body("email").isEmail().withMessage("유효하지 않는 이메일 형식 입니다.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("비밀번호는 최소 6자 이상이어야 합니다."),
    body("passwordConfirm").custom((value, { req }) => {
      console.log("비밀번호 확인: ", value, req.body.password);
      if (value !== req.body.password) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }
      return true;
    }),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(userController.register)
); // /api/users/register - 사용자 회원가입

// PUT
router.put(
  "/profile",
  AuthenticationMiddleware.isAdmin,
  [
    body("username")
      .notEmpty()
      .withMessage("사용자 이름을 입력해주세요.")
      .isLength({ max: 50 })
      .withMessage("사용자 이름은 50자 이하로 입력해주세요.")
      .trim(),
    body("bio")
      .optional({ nullable: true })
      .isLength({ max: 200 })
      .withMessage("자기소개는 200자 이하로 입력해주세요.")
      .trim(),
    body("website")
      .optional({ nullable: true })
      .isURL()
      .withMessage("유효하지 않은 URL 형식입니다.")
      .trim(),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(userController.updateProfile)
); // /api/users/profile - 사용자 프로필 업데이트
router.put(
  "/profile/image",
  AuthenticationMiddleware.isAdmin,
  imageUpload.single("profileImage"),
  AsyncHandler.wrap(userController.uploadProfileImage)
); // /api/users/profile/image - 사용자 프로필 이미지 업로드
router.put(
  "/profile/password",
  AuthenticationMiddleware.isAdmin,
  [
    body("currentPassword").notEmpty().withMessage("현재 비밀번호를 입력해주세요.").trim(),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("비밀번호는 최소 6자 이상이어야 합니다.")
      .trim(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }
      return true;
    }),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(userController.changePassword)
); // /api/users/profile/password - 사용자 비밀번호 변경

// DELETE
router.delete("/profile/image/delete", AsyncHandler.wrap(userController.deleteProfileImage)); // /api/users/profile/image - 사용자 프로필 이미지 삭제

export default router;
