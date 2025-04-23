import { Router } from "express";
import postRoutes from "../modules/post/v1/post.routes";

const router = Router();

// /api/v1/posts
router.use("/posts", postRoutes);

export default router;
