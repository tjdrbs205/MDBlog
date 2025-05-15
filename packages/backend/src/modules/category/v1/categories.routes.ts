import { Router } from "express";
import { CategoryController } from "./categories.controller";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import { body, param } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";

const router = Router();
const categoryController = new CategoryController();

// /categories
router.get("/", AsyncHandler.wrap(categoryController.list));

router.post(
  "/",
  AuthenticationMiddleware.isAdmin,
  [
    body("name").notEmpty().withMessage("카테고리 이름은 필수입니다.").trim(),
    body("parent").optional({ nullable: true }),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(categoryController.create)
);

router.put(
  "/:id",
  AuthenticationMiddleware.isAdmin,
  [
    param("id").notEmpty().withMessage("카테고리 ID는 필수입니다."),
    body("name").notEmpty().withMessage("카테고리 이름은 필수입니다.").trim(),
    body("parent").optional({ nullable: true }),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(categoryController.update)
);

router.delete(
  "/:id",
  AuthenticationMiddleware.isAdmin,
  [
    param("id").isMongoId().withMessage("유효하지 않은 카테고리 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(categoryController.delete)
);

export default router;
