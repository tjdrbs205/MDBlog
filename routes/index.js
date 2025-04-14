const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Setting = require("../models/Setting");
const { marked } = require("marked"); // 마크다운 변환 라이브러리 추가
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

    // 사이트 설정 가져오기
    const siteDescription = await Setting.getSetting(
      "siteDescription",
      "MongoDB와 Express.js를 사용한 현대적인 블로그 시스템입니다. 마크다운을 지원하고 태그와 카테고리로 콘텐츠를 관리할 수 있습니다."
    );

    res.render("index", {
      title: "홈",
      popularPosts,
      latestPosts,
      categoryPosts,
      popularTags,
      siteDescription,
    });
  })
);

// 소개 페이지 렌더
router.get(
  "/about",
  asyncHandler(async (req, res) => {
    // 블로그 소개글 가져오기
    const aboutBlog = await Setting.getSetting(
      "aboutBlog",
      "## 안녕하세요! MDBlog에 오신 것을 환영합니다.\n\n이 블로그는 MongoDB와 Express.js를 사용하여 개발된 현대적인 블로그 시스템입니다. 개발 관련 지식과 경험을 공유하기 위한 공간입니다.\n\n### 주요 기능\n\n- 마크다운 지원으로 쉽고 빠른 글 작성\n- 카테고리와 태그를 활용한 콘텐츠 관리\n- 반응형 디자인으로 모바일 환경 지원\n\n더 많은 정보는 블로그 글을 통해 확인하세요!"
    );

    // 마크다운을 HTML로 변환
    const aboutBlogHtml = marked(aboutBlog);

    res.render("layouts/main", {
      title: "블로그 소개",
      contentView: "about",
      aboutBlogHtml,
    });
  })
);

module.exports = router;
