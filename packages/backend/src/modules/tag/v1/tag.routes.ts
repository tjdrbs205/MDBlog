import { Router } from "express";
import TagController from "./tag.controller";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";
import { body, param } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";

const router = Router();
const tagController = new TagController();

router.get("/", AsyncHandler.wrap(tagController.list));

router.post(
  "/",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  [
    body("name").notEmpty().withMessage("태그 이름은 필수입니다.").trim(),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(tagController.create)
);

router.delete(
  "/:id",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  [
    param("id").isMongoId().withMessage("유효한 MongoDB ID가 아닙니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(tagController.delete)
);

export default router;
