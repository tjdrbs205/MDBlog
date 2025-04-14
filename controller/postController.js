const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");

/**
 * 모든 게시물 조회 및 필터링
 */
exports.listPosts = async (req, res) => {
  const { category, tag, q, sort = "newest" } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // 필터 구성
  const filter = { isPublic: true };

  if (category) {
    filter.category = category;
  }

  if (tag) {
    filter.tags = { $in: [tag] };
  }

  if (q) {
    filter.$or = [{ title: new RegExp(q, "i") }, { content: new RegExp(q, "i") }];
  }

  // 정렬 옵션 설정
  let sortOption = { createdAt: -1 }; // 기본값 (최신순)

  if (sort === "oldest") {
    sortOption = { createdAt: 1 };
  } else if (sort === "title") {
    sortOption = { title: 1 };
  } else if (sort === "views") {
    sortOption = { view: -1 };
  }

  // 게시물, 카테고리, 태그, 최근 게시물, 카테고리별 게시물 수 조회 (병렬 처리)
  const [posts, totalPosts, categories, tags, recentPosts] = await Promise.all([
    Post.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name"),
    Post.countDocuments(filter),
    Category.find().sort({ order: 1 }),
    Tag.find().sort({ name: 1 }),
    Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt featuredImage"),
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
      // null 카테고리 제외
      categoryMap[item._id.toString()] = item.count;
    }
  });

  // 총 게시물 수 (통계용)
  const postStats = {
    total: totalPosts,
    // 여기에 다른 통계 정보 추가 가능
  };

  // 페이지네이션 정보
  const totalPages = Math.ceil(totalPosts / limit);

  res.render("layouts/main", {
    title: "게시물 목록",
    posts,
    categories, // 사이드바에 필요한 데이터
    tags, // 사이드바에 필요한 데이터
    recentPosts, // 최근 게시물 추가
    categoryMap, // 카테고리별 게시물 수
    postStats, // 게시물 통계
    q,
    sort,
    selectedCategory: category || null,
    selectedTag: tag || null,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    contentView: "posts/list", // "posts/list"로 수정
  });
};

/**
 * 내 게시물 목록 조회
 */
exports.getMyPosts = async (req, res) => {
  // 데이터 병렬 로드
  const [posts, categories, tags] = await Promise.all([
    Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("category", "name")
      .populate("tags", "name"),
    Category.find().sort({ name: 1 }), // 사이드바용 카테고리
    Tag.find().sort({ name: 1 }), // 사이드바용 태그
  ]);

  res.render("layouts/main", {
    title: "내 게시물",
    posts,
    categories,
    tags,
    contentView: "posts/my-posts", // 경로 수정 (../posts/my-posts -> posts/my-posts)
  });
};

/**
 * 게시물 작성 폼 렌더링
 */
exports.renderNewForm = async (req, res) => {
  const [categories, tags] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Tag.find().sort({ name: 1 }),
  ]);

  res.render("layouts/main", {
    title: "새 게시물 작성",
    categories,
    tags,
    post: {}, // 빈 게시물 객체 (폼 재사용을 위해)
    contentView: "posts/new", // ../posts/new -> posts/new로 수정
  });
};

/**
 * 새 게시물 생성
 */
exports.createPost = async (req, res) => {
  const { title, content, category, tags, isPublic, status } = req.body;

  // 태그 처리
  let tagIds = [];
  if (tags) {
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
  }

  // 게시물 생성
  const post = await Post.create({
    title,
    content,
    author: req.user._id,
    category: category || null,
    tags: tagIds,
    isPublic: isPublic === "true" || isPublic === true,
    status: status || "published",
  });

  req.flash("success", "게시물이 성공적으로 작성되었습니다.");
  res.redirect(`/posts/${post._id}`);
};

/**
 * 게시물 상세 조회
 */
exports.getPostDetail = async (req, res) => {
  const post = await Post.findById(req.params.id)
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

  // 조회수 증가 (중복 방지를 위한 쿠키 검사)
  const postViewed = req.cookies[`post_${post._id}`];
  if (!postViewed) {
    // 24시간 만료 쿠키 설정
    res.cookie(`post_${post._id}`, "1", {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    // 조회수 증가
    post.view += 1;
    await post.save();
  }

  // 관련 게시물 조회 및 사이드바 데이터 로드 (병렬 처리)
  let relatedPosts = [];
  let categories = [];
  let tags = [];
  let recentPosts = [];

  const promises = [
    Category.find().sort({ name: 1 }),
    Tag.find().sort({ name: 1 }),
    Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt featuredImage"),
  ];

  // 관련 게시물 조회 조건 추가
  if (post.tags && post.tags.length > 0) {
    promises.push(
      Post.find({
        tags: { $in: post.tags },
        _id: { $ne: post._id },
        isPublic: true,
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("author", "username")
        .populate("category", "name")
    );
  }

  // 병렬 데이터 로드 실행
  const results = await Promise.all(promises);
  categories = results[0];
  tags = results[1];
  recentPosts = results[2];
  if (results[3]) {
    relatedPosts = results[3];
  }

  res.render("layouts/main", {
    title: post.title,
    post,
    relatedPosts,
    categories,
    tags,
    recentPosts,
    contentView: "posts/detail", // "../posts/detail" -> "posts/detail"로 수정
  });
};

/**
 * 게시물 수정 폼 렌더링
 */
exports.renderEditForm = async (req, res) => {
  const [post, categories, tags] = await Promise.all([
    Post.findById(req.params.id),
    Category.find().sort({ name: 1 }),
    Tag.find().sort({ name: 1 }),
  ]);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 작성자 또는 관리자만 수정 가능
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    const error = new Error("게시물을 수정할 권한이 없습니다");
    error.statusCode = 403;
    throw error;
  }

  res.render("layouts/main", {
    title: "게시물 수정",
    post,
    categories,
    tags,
    contentView: "posts/edit", // "../posts/edit" -> "posts/edit"로 수정
  });
};

/**
 * 게시물 업데이트
 */
exports.updatePost = async (req, res) => {
  const { title, content, category, tags, isPublic, status } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 작성자 또는 관리자만 수정 가능
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    const error = new Error("게시물을 수정할 권한이 없습니다");
    error.statusCode = 403;
    throw error;
  }

  // 태그 처리
  let tagIds = [];
  if (tags) {
    if (Array.isArray(tags)) {
      tagIds = tags;
    } else if (typeof tags === "string" && tags.includes(",")) {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      for (const tagName of tagArray) {
        let tag = await Tag.findOne({ name: tagName.toLowerCase() });
        if (!tag) {
          tag = await Tag.create({ name: tagName.toLowerCase() });
        }
        tagIds.push(tag._id);
      }
    } else {
      tagIds = [tags];
    }
  }

  // 게시물 업데이트
  post.title = title;
  post.content = content;
  post.category = category || null;
  post.tags = tagIds;
  post.isPublic = isPublic === "true" || isPublic === true;
  post.status = status || "published";
  post.updatedAt = Date.now();

  await post.save();

  req.flash("success", "게시물이 성공적으로 수정되었습니다.");
  res.redirect(`/posts/${post._id}`);
};

/**
 * 게시물 삭제
 */
exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 작성자 또는 관리자만 삭제 가능
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    const error = new Error("게시물을 삭제할 권한이 없습니다");
    error.statusCode = 403;
    throw error;
  }

  // post.delete() 대신 findByIdAndDelete 사용
  await Post.findByIdAndDelete(post._id);

  req.flash("success", "게시물이 성공적으로 삭제되었습니다.");
  res.redirect("/posts");
};

/**
 * 댓글 추가
 */
exports.addComment = async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;

  if (!content || !content.trim()) {
    const error = new Error("댓글 내용을 입력해주세요");
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("게시물을 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 댓글 추가
  post.comments.push({
    author: req.user._id,
    content,
    createdAt: Date.now(),
  });

  await post.save();

  res.redirect(`/posts/${postId}#comments`);
};

/**
 * 댓글 삭제
 */
exports.deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;

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

  // 댓글 작성자 또는 관리자만 삭제 가능
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    const error = new Error("댓글을 삭제할 권한이 없습니다");
    error.statusCode = 403;
    throw error;
  }

  // 댓글 삭제 - pull 메소드를 사용하여 배열에서 댓글 제거
  post.comments.pull({ _id: commentId });
  await post.save();

  res.redirect(`/posts/${postId}#comments`);
};

/**
 * 인기 게시물 목록 조회
 */
exports.listPopularPosts = async (req, res) => {
  const { category, tag, q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // 인기 게시물은 조회수 기준으로 정렬
  const filter = { isPublic: true };

  // 카테고리 필터 추가
  if (category) {
    filter.category = category;
  }

  // 태그 필터 추가
  if (tag) {
    filter.tags = { $in: [tag] };
  }

  // 검색어 필터 추가
  if (q) {
    filter.$or = [{ title: new RegExp(q, "i") }, { content: new RegExp(q, "i") }];
  }

  const sortOption = { view: -1 }; // 조회수 내림차순

  // 병렬 데이터 조회
  const [posts, totalPosts, categories, tags, recentPosts] = await Promise.all([
    Post.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name"),
    Post.countDocuments(filter),
    Category.find().sort({ order: 1 }),
    Tag.find().sort({ name: 1 }),
    Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt featuredImage"),
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

  // 총 게시물 수 (통계용)
  const postStats = {
    total: totalPosts,
  };

  // 페이지네이션 정보
  const totalPages = Math.ceil(totalPosts / limit);

  res.render("layouts/main", {
    title: "인기 게시물",
    posts,
    categories,
    tags,
    recentPosts,
    categoryMap,
    postStats,
    q, // 추가: 검색어 변수
    sort: "views", // 정렬 방식 표시
    selectedCategory: category || null, // 선택된 카테고리
    selectedTag: tag || null, // 선택된 태그
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    contentView: "posts/list",
  });
};

/**
 * 아카이브 페이지 (월별, 연도별 게시물)
 */
exports.getArchive = async (req, res) => {
  const { year, month } = req.query;

  // 아카이브 데이터 구성을 위한 집계 쿼리
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

  // 필터링된 게시물 조회
  let filteredPosts = [];
  if (year) {
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
    const endDate = new Date(parseInt(year), month ? parseInt(month) : 12, 0);

    filteredPosts = await Post.find({
      isPublic: true,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name");
  }

  // 사이드바 데이터 로드
  const [categories, tags, recentPosts] = await Promise.all([
    Category.find().sort({ order: 1 }),
    Tag.find().sort({ name: 1 }),
    Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt featuredImage"),
  ]);

  res.render("layouts/main", {
    title: "게시물 아카이브",
    archiveByYear,
    filteredPosts,
    selectedYear: year,
    selectedMonth: month,
    categories,
    tags,
    recentPosts,
    contentView: "posts/archive",
  });
};
