/**
 * Admin Service
 * 관리자 기능 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const User = require("../models/User");
const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Stats = require("../models/Stats");
const Visitor = require("../models/Visitor");

/**
 * 대시보드 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 대시보드 통계 데이터
 */
exports.getDashboardStats = async () => {
  // 병렬로 통계 데이터 조회
  const [
    totalPosts,
    totalUsers,
    totalCategories,
    totalTags,
    recentPosts,
    recentUsers,
    recentComments,
    mostViewedPosts,
  ] = await Promise.all([
    Post.countDocuments(),
    User.countDocuments(),
    Category.countDocuments(),
    Tag.countDocuments(),
    Post.find().sort({ createdAt: -1 }).limit(5).populate("author", "username"),
    User.find().sort({ joinedAt: -1 }).limit(5).select("-password"),
    Post.aggregate([
      { $unwind: "$comments" },
      { $sort: { "comments.createdAt": -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          _id: 1,
          comment: "$comments",
        },
      },
    ]),
    Post.find().sort({ view: -1 }).limit(5),
  ]);

  return {
    counts: {
      posts: totalPosts,
      users: totalUsers,
      categories: totalCategories,
      tags: totalTags,
    },
    recentPosts,
    recentUsers,
    recentComments,
    mostViewedPosts,
  };
};

/**
 * 방문자 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 방문자 통계 데이터
 */
exports.getVisitorStats = async () => {
  const currentDate = new Date();
  const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const startOfThisWeek = new Date(currentDate);
  startOfThisWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // 병렬로 통계 데이터 조회
  const [todayVisitors, weeklyVisitors, monthlyVisitors, totalVisitors, dailyVisitorsForChart] = await Promise.all([
    Visitor.countDocuments({ visitedAt: { $gte: startOfToday } }),
    Visitor.countDocuments({ visitedAt: { $gte: startOfThisWeek } }),
    Visitor.countDocuments({ visitedAt: { $gte: startOfThisMonth } }),
    Visitor.countDocuments(),
    Visitor.aggregate([
      {
        $match: {
          visitedAt: { $gte: new Date(startOfThisMonth) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$visitedAt" },
            month: { $month: "$visitedAt" },
            day: { $dayOfMonth: "$visitedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]),
  ]);

  // 차트용 데이터 가공
  const chartData = dailyVisitorsForChart.map((item) => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return {
      date: date.toISOString().slice(0, 10),
      count: item.count,
    };
  });

  return {
    today: todayVisitors,
    weekly: weeklyVisitors,
    monthly: monthlyVisitors,
    total: totalVisitors,
    dailyStats: chartData,
  };
};

/**
 * 콘텐츠 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 콘텐츠 통계 데이터
 */
exports.getContentStats = async () => {
  // 병렬로 통계 데이터 조회
  const [totalPosts, publishedPosts, draftPosts, totalComments, categoryCounts, tagCounts] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ isPublic: true }),
    Post.countDocuments({ isPublic: false }),
    Post.aggregate([
      { $project: { commentCount: { $size: "$comments" } } },
      { $group: { _id: null, total: { $sum: "$commentCount" } } },
    ]),
    Post.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // 카테고리 이름 조회
  const categoryIds = categoryCounts.map((c) => c._id).filter((id) => id !== null);
  const categories = await Category.find({ _id: { $in: categoryIds } });
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  // 태그 이름 조회
  const tagIds = tagCounts.map((t) => t._id);
  const tags = await Tag.find({ _id: { $in: tagIds } });
  const tagMap = {};
  tags.forEach((tag) => {
    tagMap[tag._id.toString()] = tag.name;
  });

  return {
    posts: {
      total: totalPosts,
      published: publishedPosts,
      draft: draftPosts,
    },
    comments: totalComments.length > 0 ? totalComments[0].total : 0,
    categoryStats: categoryCounts.map((item) => ({
      _id: item._id,
      name: item._id ? categoryMap[item._id.toString()] || "미분류" : "미분류",
      count: item.count,
    })),
    tagStats: tagCounts.map((item) => ({
      _id: item._id,
      name: tagMap[item._id.toString()] || "알 수 없음",
      count: item.count,
    })),
  };
};

/**
 * 사용자 관리 데이터 조회 서비스
 * @param {Object} options - 페이지네이션, 정렬 등 옵션
 * @returns {Promise<Object>} 사용자 목록 및 페이지네이션 정보
 */
exports.getUsersWithPagination = async (options = {}) => {
  const { sort = { joinedAt: -1 }, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // 사용자 및 총 개수 조회
  const [users, totalUsers] = await Promise.all([
    User.find().select("-password").sort(sort).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  // 페이지네이션 정보 계산
  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    totalUsers,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * 게시물 관리 데이터 조회 서비스
 * @param {Object} options - 페이지네이션, 필터, 정렬 등 옵션
 * @returns {Promise<Object>} 게시물 목록 및 페이지네이션 정보
 */
exports.getPostsWithPagination = async (options = {}) => {
  const { sort = { createdAt: -1 }, page = 1, limit = 20, filter = {} } = options;
  const skip = (page - 1) * limit;

  // 게시물 및 총 개수 조회
  const [posts, totalPosts] = await Promise.all([
    Post.find(filter).populate("author", "username").populate("category", "name").sort(sort).skip(skip).limit(limit),
    Post.countDocuments(filter),
  ]);

  // 페이지네이션 정보 계산
  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts,
    totalPosts,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * 사용자 상태 변경 서비스
 * @param {string} userId - 사용자 ID
 * @param {boolean} isActive - 활성화 상태
 * @returns {Promise<Object>} 업데이트된 사용자
 */
exports.updateUserStatus = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select("-password");

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * 사용자 역할 변경 서비스
 * @param {string} userId - 사용자 ID
 * @param {string} role - 역할 ('user' 또는 'admin')
 * @returns {Promise<Object>} 업데이트된 사용자
 */
exports.updateUserRole = async (userId, role) => {
  if (!["user", "admin"].includes(role)) {
    const error = new Error("유효하지 않은 역할입니다");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return user;
};
