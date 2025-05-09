import { Router } from "express";
import PostController from "./post.controller";

const router = Router();
const postController = new PostController();

// GET /api/posts/test - 테스트용 API
router.get("/test", postController.getTest);
// GET /api/posts - 게시물 목록 조회
router.get("/", postController.getPosts);

export default router;
