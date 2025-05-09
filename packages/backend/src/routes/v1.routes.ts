import { Router } from "express";
import postRoutes from "../modules/post/v1/post.routes";
import userRoutes from "../modules/user/v1/user.routes";

const router = Router();

// /api/posts
router.use("/posts", postRoutes);
router.use("/users", userRoutes);

export default router;
