import { Router } from "express";
import PostController from "./post.controller";
import { body, param, query } from "express-validator";
import ValidationMiddleware from "../../../common/middlewares/validation.Middleware";
import AsyncHandler from "../../../common/middlewares/AsyncHandler.Middleware";
import AuthenticationMiddleware from "../../../common/middlewares/Authentication.Middleware";
import { imageUpload } from "../../../common/utils/fileUpload.util";
import imageUploadLimiter from "../../../common/middlewares/ImageUploadLimiter.Middleware";

const router = Router();
const postController = new PostController();

// GET /api/posts - 게시물 목록 조회
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지는 1보다 커야합니다."),
    query("sort")
      .optional()
      .isIn(["newest", "oldest", "title", "view"])
      .withMessage("유효하지 않은 정렬 기준입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.listPosts)
);
router.get(
  "/popular",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지는 1보다 커야합니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.listPopularPosts)
);
router.get(
  "/archive",
  [
    query("year").optional().isInt({ min: 2025 }).withMessage("유효하지 않은 연도입니다."),
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("유효하지 않은 월입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.getArchive)
);

router.get(
  "/:id",
  [
    param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.detailPost)
);

router.post(
  "/",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  [
    body("title").notEmpty().withMessage("제목을 입력해주세요.").trim(),
    body("content").notEmpty().withMessage("내용을 입력해주세요.").trim(),
    body("isPublic").optional().isBoolean().withMessage("공개 여부는 true 또는 false여야 합니다."),
    body("status")
      .optional()
      .isIn(["draft", "published"])
      .withMessage("상태는 'draft' 또는 'published'여야 합니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.createPost)
);

router.post(
  "/:id/comment",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isLoggedIn,
  [
    param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    body("content").notEmpty().withMessage("댓글 내용을 입력해주세요.").trim(),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.addComment)
);

router.post(
  "/image",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  imageUpload.single("postImage"),
  imageUploadLimiter.rateLimit(1, 5), // 1분에 최대 5번 업로드 가능
  AsyncHandler.wrap(postController.uploadPostImage)
);

router.put(
  "/:id",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  [
    param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    body("title").optional().notEmpty().withMessage("제목을 입력해주세요.").trim(),
    body("content").optional().notEmpty().withMessage("내용을 입력해주세요.").trim(),
    body("isPublic").optional().isBoolean().withMessage("공개 여부는 true 또는 false여야 합니다."),
    body("status")
      .optional()
      .isIn(["draft", "published"])
      .withMessage("상태는 'draft' 또는 'published'여야 합니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.updatePost)
);

router.delete(
  "/:id",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isAdmin,
  [
    param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.deletePost)
);

router.delete(
  "/:postId/comment",
  AuthenticationMiddleware.jwtAuthorization,
  AuthenticationMiddleware.isLoggedIn,
  [
    param("postId").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    body("commentId").isMongoId().withMessage("유효하지 않은 댓글 ID입니다."),
    ValidationMiddleware.validateRequest,
  ],
  AsyncHandler.wrap(postController.deleteComment)
);

router.delete("/", AuthenticationMiddleware.jwtAuthorization, AuthenticationMiddleware.isAdmin);

export default router;
