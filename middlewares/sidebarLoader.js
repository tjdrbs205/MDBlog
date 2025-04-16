// middlewares/sidebarLoader.js
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Post = require("../models/Post_temp");
const Stats = require("../models/Stats"); // Stats 모델 추가
const asyncHandler = require("./asyncHandler");

/**
 * 모든 라우트에서 사이드바에 필요한 카테고리와 태그 데이터를 로드하는 미들웨어
 */
const sidebarLoader = asyncHandler(async (req, res, next) => {
  // 병렬로 데이터 로드
  const [
    categoriesHierarchical,
    tags,
    recentPosts,
    totalPosts,
    categoryPostCounts,
    todayStats,
    totalStats,
    regionStats,
    browserStats,
  ] = await Promise.all([
    // 계층 구조로 카테고리 목록 조회
    Category.getHierarchicalCategories(),
    // 태그 목록 조회
    Tag.find().sort({ name: 1 }),
    // 최근 게시물 조회
    Post.find({ isPublic: true }).sort({ createdAt: -1 }).limit(5).select("title createdAt featuredImage"),
    // 전체 게시물 수 조회
    Post.countDocuments({ isPublic: true }),
    // 카테고리별 게시물 수 계산
    Post.aggregate([{ $match: { isPublic: true } }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
    // 오늘 방문자 통계
    Stats.getToday(),
    // 전체 방문자 통계
    Stats.getTotalStats(),
    // 지역별 방문자 통계
    Stats.getRegionStats(),
    // 브라우저별 방문자 통계
    Stats.getBrowserStats(),
  ]);

  // 카테고리별 게시물 수를 객체로 변환
  const categoryMap = {};
  categoryPostCounts.forEach((item) => {
    if (item._id) {
      // null 카테고리 제외
      categoryMap[item._id.toString()] = item.count;
    }
  });

  // 실시간 활성 방문자 수 조회
  const activeVisitorsCount = Stats.getActiveVisitorsCount();

  // 게시물 및 방문자 통계 정보
  const stats = {
    posts: {
      total: totalPosts,
    },
    visits: {
      today: todayStats.visits || 0,
      total: totalStats && totalStats.totalVisits ? totalStats.totalVisits : 0,
      totalPageViews: totalStats && totalStats.totalPageViews ? totalStats.totalPageViews : 0,
      totalUniqueVisitors: totalStats && totalStats.totalUniqueVisitors ? totalStats.totalUniqueVisitors : 0,
      active: activeVisitorsCount,
    },
    regions: regionStats,
    browsers: browserStats,
  };

  // 원래 형식의 카테고리 목록도 함께 가져오기 (하위 호환성)
  const categories = await Category.find().sort({ name: 1 });

  // 응답 객체에 데이터 설정
  res.locals.categories = categories; // 기존 형식 유지
  res.locals.categoriesHierarchical = categoriesHierarchical; // 계층 구조 추가
  res.locals.tags = tags;
  res.locals.recentPosts = recentPosts;
  res.locals.categoryMap = categoryMap;
  res.locals.postStats = stats.posts;
  res.locals.stats = stats; // 전체 통계 정보

  // selectedCategory가 정의되지 않은 경우 null로 기본값 설정
  if (typeof res.locals.selectedCategory === "undefined") {
    res.locals.selectedCategory = null;
  }

  // selectedTag가 정의되지 않은 경우 null로 기본값 설정
  if (typeof res.locals.selectedTag === "undefined") {
    res.locals.selectedTag = null;
  }

  // sort가 정의되지 않은 경우 기본값 설정
  if (typeof res.locals.sort === "undefined") {
    res.locals.sort = "newest";
  }

  // q(검색어)가 정의되지 않은 경우 빈 문자열로 설정
  if (typeof res.locals.q === "undefined") {
    res.locals.q = "";
  }

  next();
});

module.exports = sidebarLoader;
