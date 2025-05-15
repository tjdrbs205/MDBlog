import { Router } from "express";
import postRoutes from "../modules/post/v1/post.routes";
import userRoutes from "../modules/user/v1/user.routes";
import adminRoutes from "../modules/admin/v1/admin.routes";
import categoriesRoutes from "../modules/category/v1/categories.routes";
import tagRoutes from "../modules/tag/v1/tag.routes";

const router = Router();

// api
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoriesRoutes);
router.use("/tags", tagRoutes);

export default router;
