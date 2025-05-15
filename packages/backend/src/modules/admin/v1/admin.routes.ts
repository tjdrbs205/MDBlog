import { Router } from "express";
import AdminController from "./admin.controller";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";
import { param } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import { imageUpload } from "../../../common/utils/fileUpload.util";

const router = Router();
const adminController = new AdminController();

router.use(AuthenticationMiddleware.isAdmin);

router.post("/settings", AsyncHandler.wrap(adminController.saveSettings));
router.post(
  "/settings/profile-image",
  imageUpload.single("profileImage"),
  AsyncHandler.wrap(adminController.uploadProfileImage)
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
