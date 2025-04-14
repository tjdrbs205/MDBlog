const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const asyncHandler = require("../middlewares/asyncHandler");

// 메인 페이지 렌더
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // 인기 게시물 (조회수 기준 상위 4개)
    const popularPosts = await Post.find({ status: "published" })
      .sort({ views: -1 })
      .limit(4)
      .populate("author", "username")
      .populate("category")
      .populate("tags");

    // 최신 게시물 (최근 발행된 6개)
    const latestPosts = await Post.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("author", "username")
      .populate("category")
      .populate("tags");

    // 카테고리별 최신 글 (상위 카테고리 3개에 대해)
    const topCategories = await Category.find({}).sort({ postCount: -1 }).limit(3);

    // 각 카테고리별 최신 글 2개씩 조회
    const categoryPosts = await Promise.all(
      topCategories.map(async (category) => {
        const posts = await Post.find({
          category: category._id,
          status: "published",
        })
          .sort({ createdAt: -1 })
          .limit(2)
          .populate("author", "username");

        return {
          category,
          posts,
        };
      })
    );

    // 인기 태그 (사용 빈도 기준 상위 10개)
    const popularTags = await Tag.find({}).sort({ postCount: -1 }).limit(10);

    res.render("index", {
      title: "나의 개발 블로그",
      popularPosts,
      latestPosts,
      categoryPosts,
      popularTags,
    });
  })
);

// 소개 페이지 렌더
router.get("/about", async (req, res) => {
  res.render("layouts/main", {
    title: "블로그 소개",
    contentView: "about",
  });
});

module.exports = router;
