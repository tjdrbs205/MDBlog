import { Router } from "express";
import AdminController from "./admin.controller";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";
import { param, query } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import { imageUpload } from "../../../common/utils/fileUpload.util";

const router = Router();
const adminController = new AdminController();

router.use(AuthenticationMiddleware.jwtAuthorization, AuthenticationMiddleware.isAdmin);

router.get("/dashboard", AsyncHandler.wrap(adminController.getDashboardInitData));
router.get(
  "/users",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(adminController.getUserManagementData)
);
router.get("/settings", AsyncHandler.wrap(adminController.getSettingsData));

router.put(
  "/settings",
  imageUpload.single("blogProfileImage"),
  AsyncHandler.wrap(adminController.saveSettings)
);

router.put("/users/status", AsyncHandler.wrap(adminController.updateUserStatus));
router.put("/users/role", AsyncHandler.wrap(adminController.updateUserRole));

router.delete("/settings/profile-image", adminController.deleteProfileImage);
router.delete(
  "/users/:id",
  [
    param("id").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(adminController.deleteUser)
);
router.delete(
  "/posts/:id",
  [
    param("id").isMongoId().withMessage("유효하지 않은 포스트 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(adminController.deletePost)
);
router.delete(
  "/comments/:postId/:commentId",
  [
    param("postId").isMongoId().withMessage("유효하지 않은 포스트 ID입니다."),
    param("commentId").isMongoId().withMessage("유효하지 않은 댓글 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(adminController.deleteComment)
);

export default router;
