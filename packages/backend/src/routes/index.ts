import { Router } from "express";
import v1Routes from "./v1.routes"; // v1 라우터 임포트

import SidebarLoaderMiddleware from "../common/middlewares/SidebarLoader.Middleware";
import SettingsLoaderMiddleware from "../common/middlewares/SettingsLoader.Middleware";

const router = Router();

// /api/v1
router.use("/api", v1Routes);

// 초기 데이터 로드
router.get(
  "/api/init",
  SettingsLoaderMiddleware.handle,
  SidebarLoaderMiddleware.handle,
  (req, res) => {
    const {
      siteDescription,
      aboutBlog,
      contactGithub,
      contactEmail,
      profileImage,
      aboutBlogHtml,
      categories,
      categoriesHierarchical,
      tags,
      recentPosts,
      categoryMap,
      postStats,
      stats,
    } = res.locals;
    res.json({
      siteDescription,
      aboutBlog,
      aboutBlogHtml,
      contactGithub,
      contactEmail,
      profileImage,
      categories,
      categoriesHierarchical,
      tags,
      recentPosts,
      categoryMap,
      postStats,
      stats,
    });
  }
);

export default router;
