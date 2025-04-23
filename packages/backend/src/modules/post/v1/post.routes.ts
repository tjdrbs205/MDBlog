import { Router } from "express";
import { PostController } from "./post.controller";

const router = Router();
const postController = new PostController();

// GET /api/v1/posts - 게시물 목록 조회
router.get("/", postController.getPosts);

export default router;
