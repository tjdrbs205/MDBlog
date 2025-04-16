/**
 * Post Service
 * 게시물 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");

/**
 * 게시물 목록 조회 서비스
 * @param {Object} filter - 필터 조건
 * @param {Object} options - 페이지네이션, 정렬 등 옵션
 * @returns {Promise<Object>} 게시물 목록 및 페이지네이션 정보
 */
exports.getPosts = async (filter, options) => {
  const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  // 게시물 및 총 개수 병렬 조회
  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name"),
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
 * 게시물 상세 조회 서비스
 * @param {string} postId - 게시물 ID
 * @returns {Promise<Object>} 게시물 상세 정보
 */
exports.getPostById = async (postId) => {
  const post = await Post.findById(postId)
    .populate("author", "username")
    .populate("category", "name")
    .populate("tags", "name")
    .populate({
      path: "comments.author",
      select: "username profileImage",
    });

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return post;
};

/**
 * 관련 게시물 조회 서비스
 * @param {Array} tagIds - 태그 ID 배열
 * @param {string} postId - 현재 게시물 ID (제외할 게시물)
 * @param {number} limit - 조회할 게시물 수
 * @returns {Promise<Array>} 관련 게시물 배열
 */
exports.getRelatedPosts = async (tagIds, postId, limit = 3) => {
  if (!tagIds || tagIds.length === 0) {
    return [];
  }

  return Post.find({
    tags: { $in: tagIds },
    _id: { $ne: postId },
    isPublic: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "username")
    .populate("category", "name");
};

/**
 * 사이드바 데이터 조회 서비스
 * @returns {Promise<Object>} 사이드바에 필요한 데이터
 */
exports.getSidebarData = async () => {
  const [categories, tags, recentPosts] = await Promise.all([
    Category.find().sort({ order: 1 }),
    Tag.find().sort({ name: 1 }),
    Post.find({ isPublic: true }).sort({ createdAt: -1 }).limit(5).select("title createdAt featuredImage"),
  ]);

  // 카테고리별 게시물 수 계산
  const categoryPostCounts = await Post.aggregate([
    { $match: { isPublic: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  // 카테고리 객체에 게시물 수 추가
  const categoryMap = {};
  categoryPostCounts.forEach((item) => {
    if (item._id) {
      categoryMap[item._id.toString()] = item.count;
    }
  });

  return {
    categories,
    tags,
    recentPosts,
    categoryMap,
  };
};

/**
 * 게시물 생성 서비스
 * @param {Object} postData - 게시물 데이터
 * @param {string} userId - 작성자 ID
 * @returns {Promise<Object>} 생성된 게시물
 */
exports.createPost = async (postData, userId) => {
  const { title, content, category, tags, isPublic, status } = postData;

  // 태그 처리
  const tagIds = await processTagsInput(tags);

  // 게시물 생성
  const post = await Post.create({
    title,
    content,
    author: userId,
    category: category || null,
    tags: tagIds,
    isPublic: isPublic === "true" || isPublic === true,
    status: status || "published",
  });

  return post;
};

/**
 * 게시물 수정 서비스
 * @param {string} postId - 게시물 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 수정된 게시물
 */
exports.updatePost = async (postId, updateData) => {
  const { title, content, category, tags, isPublic, status } = updateData;

  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 태그 처리
  const tagIds = await processTagsInput(tags);

  // 게시물 업데이트
  post.title = title;
  post.content = content;
  post.category = category || null;
  post.tags = tagIds;
  post.isPublic = isPublic === "true" || isPublic === true;
  post.status = status || "published";
  post.updatedAt = Date.now();

  await post.save();
  return post;
};

/**
 * 게시물 삭제 서비스
 * @param {string} postId - 게시물 ID
 * @returns {Promise<void>}
 */
exports.deletePost = async (postId) => {
  const result = await Post.findByIdAndDelete(postId);

  if (!result) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return result;
};

/**
 * 조회수 증가 서비스
 * @param {string} postId - 게시물 ID
 * @returns {Promise<void>}
 */
exports.incrementView = async (postId) => {
  await Post.findByIdAndUpdate(postId, { $inc: { view: 1 } });
};

/**
 * 댓글 추가 서비스
 * @param {string} postId - 게시물 ID
 * @param {string} userId - 사용자 ID
 * @param {string} content - 댓글 내용
 * @returns {Promise<Object>} 업데이트된 게시물
 */
exports.addComment = async (postId, userId, content) => {
  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  post.comments.push({
    author: userId,
    content,
    createdAt: Date.now(),
  });

  await post.save();
  return post;
};

/**
 * 댓글 삭제 서비스
 * @param {string} postId - 게시물 ID
 * @param {string} commentId - 댓글 ID
 * @returns {Promise<Object>} 업데이트된 게시물
 */
exports.deleteComment = async (postId, commentId) => {
  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 댓글 찾기
  const comment = post.comments.id(commentId);

  if (!comment) {
    const error = new Error("댓글을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 댓글 삭제
  post.comments.pull({ _id: commentId });
  await post.save();

  return post;
};

/**
 * 인기 게시물 조회 서비스
 * @param {Object} filter - 필터 조건
 * @param {Object} options - 페이지네이션 등 옵션
 * @returns {Promise<Object>} 인기 게시물 목록 및 페이지네이션 정보
 */
exports.getPopularPosts = async (filter, options) => {
  options.sort = { view: -1 }; // 조회수 내림차순 정렬
  return this.getPosts(filter, options);
};

/**
 * 아카이브 데이터 조회 서비스
 * @returns {Promise<Object>} 연도 및 월별 게시물 통계
 */
exports.getArchiveData = async () => {
  const archiveData = await Post.aggregate([
    { $match: { isPublic: true } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
        posts: { $push: { _id: "$_id", title: "$title", createdAt: "$createdAt" } },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  // 연도별 그룹화
  const archiveByYear = {};
  archiveData.forEach((item) => {
    const year = item._id.year;
    const month = item._id.month;

    if (!archiveByYear[year]) {
      archiveByYear[year] = [];
    }

    archiveByYear[year].push({
      month,
      count: item.count,
      posts: item.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  });

  return { archiveByYear };
};

/**
 * 특정 연도/월 게시물 조회 서비스
 * @param {number} year - 연도
 * @param {number} month - 월 (선택사항)
 * @returns {Promise<Array>} 해당 기간의 게시물 목록
 */
exports.getPostsByYearMonth = async (year, month = null) => {
  const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
  const endDate = new Date(parseInt(year), month ? parseInt(month) : 12, 0);

  return Post.find({
    isPublic: true,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .sort({ createdAt: -1 })
    .populate("author", "username")
    .populate("category", "name")
    .populate("tags", "name");
};

/**
 * 특정 사용자의 게시물 수 조회 서비스
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 사용자가 작성한 게시물 수
 */
exports.getUserPostCount = async (userId) => {
  if (!userId) {
    return 0;
  }
  return await Post.countDocuments({ author: userId });
};

/**
 * 태그 입력 처리 유틸리티 함수
 * @param {string|Array} tags - 태그 문자열 또는 배열
 * @returns {Promise<Array>} 태그 ID 배열
 */
async function processTagsInput(tags) {
  let tagIds = [];

  if (!tags) {
    return tagIds;
  }

  // 선택된 태그가 배열인 경우 (다중 선택)
  if (Array.isArray(tags)) {
    tagIds = tags;
  }
  // 쉼표로 구분된 태그 문자열인 경우
  else if (typeof tags === "string" && tags.includes(",")) {
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    // 태그 처리 (존재하지 않는 태그는 새로 생성)
    for (const tagName of tagArray) {
      let tag = await Tag.findOne({ name: tagName.toLowerCase() });
      if (!tag) {
        tag = await Tag.create({ name: tagName.toLowerCase() });
      }
      tagIds.push(tag._id);
    }
  }
  // 단일 태그 ID인 경우
  else {
    tagIds = [tags];
  }

  return tagIds;
}
