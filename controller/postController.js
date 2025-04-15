const postService = require("../services/postService");

/**
 * 게시물 목록 조회
 */
exports.listPosts = async (req, res) => {
  try {
    const { category, tag, q, sort = "newest" } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

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

    // 서비스 호출
    const { posts, totalPosts, pagination } = await postService.getPosts(filter, {
      sort: sortOption,
      page,
      limit,
    });

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts, categoryMap } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: "게시물 목록",
      posts,
      categories,
      tags,
      recentPosts,
      categoryMap,
      postStats: { total: totalPosts },
      q,
      sort,
      selectedCategory: category || null,
      selectedTag: tag || null,
      pagination,
      contentView: "posts/list",
    });
  } catch (error) {
    req.flash("error", error.message || "게시물 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 인기 게시물 목록 조회
 */
exports.listPopularPosts = async (req, res) => {
  try {
    const { category, tag, q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

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

    // 서비스 호출
    const { posts, totalPosts, pagination } = await postService.getPopularPosts(filter, {
      page,
      limit,
    });

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts, categoryMap } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: "인기 게시물",
      posts,
      categories,
      tags,
      recentPosts,
      categoryMap,
      postStats: { total: totalPosts },
      q,
      sort: "views",
      selectedCategory: category || null,
      selectedTag: tag || null,
      pagination,
      contentView: "posts/list",
    });
  } catch (error) {
    req.flash("error", error.message || "인기 게시물 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 내 게시물 목록 조회
 */
exports.getMyPosts = async (req, res) => {
  try {
    // 내 게시물용 필터 적용
    const filter = { author: req.user._id };

    // 서비스 호출
    const { posts } = await postService.getPosts(filter, {
      sort: { createdAt: -1 },
    });

    // 사이드바 데이터 조회
    const { categories, tags } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: "내 게시물",
      posts,
      categories,
      tags,
      contentView: "posts/my-posts",
    });
  } catch (error) {
    req.flash("error", error.message || "내 게시물 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 게시물 작성 폼 렌더링
 */
exports.renderNewForm = async (req, res) => {
  try {
    // 사이드바 데이터 조회
    const { categories, tags } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: "새 게시물 작성",
      categories,
      tags,
      post: {}, // 빈 게시물 객체 (폼 재사용을 위해)
      contentView: "posts/new",
    });
  } catch (error) {
    req.flash("error", error.message || "게시물 작성 폼을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};

/**
 * 새 게시물 생성
 */
exports.createPost = async (req, res) => {
  try {
    // 서비스 호출
    const post = await postService.createPost(req.body, req.user._id);

    req.flash("success", "게시물이 성공적으로 작성되었습니다.");
    res.redirect(`/posts/${post._id}`);
  } catch (error) {
    req.flash("error", error.message || "게시물 작성 중 오류가 발생했습니다.");
    res.redirect("/posts/new");
  }
};

/**
 * 게시물 상세 조회
 */
exports.getPostDetail = async (req, res) => {
  try {
    const postId = req.params.id;

    // 게시물 조회
    const post = await postService.getPostById(postId);

    // 조회수 증가 (중복 방지를 위한 쿠키 검사)
    const postViewed = req.cookies[`post_${post._id}`];
    if (!postViewed) {
      // 24시간 만료 쿠키 설정
      res.cookie(`post_${post._id}`, "1", {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      // 조회수 증가
      await postService.incrementView(postId);
    }

    // 관련 게시물 조회
    let relatedPosts = [];
    if (post.tags && post.tags.length > 0) {
      const tagIds = post.tags.map((tag) => tag._id);
      relatedPosts = await postService.getRelatedPosts(tagIds, postId);
    }

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: post.title,
      post,
      relatedPosts,
      categories,
      tags,
      recentPosts,
      contentView: "posts/detail",
    });
  } catch (error) {
    req.flash("error", error.message || "게시물을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};

/**
 * 게시물 수정 폼 렌더링
 */
exports.renderEditForm = async (req, res) => {
  try {
    const postId = req.params.id;

    // 게시물 조회
    const post = await postService.getPostById(postId);

    // 작성자 또는 관리자만 수정 가능
    if (post.author._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      req.flash("error", "게시물을 수정할 권한이 없습니다.");
      return res.redirect(`/posts/${postId}`);
    }

    // 사이드바 데이터 조회
    const { categories, tags } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: "게시물 수정",
      post,
      categories,
      tags,
      contentView: "posts/edit",
    });
  } catch (error) {
    req.flash("error", error.message || "게시물 수정 폼을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};

/**
 * 게시물 업데이트
 */
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // 게시물 조회
    const post = await postService.getPostById(postId);

    // 작성자 또는 관리자만 수정 가능
    if (post.author._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      req.flash("error", "게시물을 수정할 권한이 없습니다.");
      return res.redirect(`/posts/${postId}`);
    }

    // 서비스 호출
    await postService.updatePost(postId, req.body);

    req.flash("success", "게시물이 성공적으로 수정되었습니다.");
    res.redirect(`/posts/${postId}`);
  } catch (error) {
    req.flash("error", error.message || "게시물 수정 중 오류가 발생했습니다.");
    res.redirect(`/posts/${req.params.id}/edit`);
  }
};

/**
 * 게시물 삭제
 */
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // 게시물 조회
    const post = await postService.getPostById(postId);

    // 작성자 또는 관리자만 삭제 가능
    if (post.author._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      req.flash("error", "게시물을 삭제할 권한이 없습니다.");
      return res.redirect(`/posts/${postId}`);
    }

    // 서비스 호출
    await postService.deletePost(postId);

    req.flash("success", "게시물이 성공적으로 삭제되었습니다.");

    // 요청 출처 확인
    const source = req.body.source;

    if (source === "admin") {
      return res.redirect("/admin/posts");
    }

    if (source === "my-posts") {
      return res.redirect("/posts/my-posts");
    }

    // 내 게시물 목록에서의 요청인 경우 (이전 방식도 유지)
    const referer = req.get("referer") || "";
    if (referer.includes("/posts/my-posts")) {
      return res.redirect("/posts/my-posts");
    }

    // 기본 경로 (일반 게시물 목록)
    res.redirect("/posts");
  } catch (error) {
    req.flash("error", error.message || "게시물 삭제 중 오류가 발생했습니다.");
    res.redirect(`/posts/${req.params.id}`);
  }
};

/**
 * 댓글 추가
 */
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;

    if (!content || !content.trim()) {
      req.flash("error", "댓글 내용을 입력해주세요.");
      return res.redirect(`/posts/${postId}#comments`);
    }

    // 서비스 호출
    await postService.addComment(postId, req.user._id, content);

    req.flash("success", "댓글이 등록되었습니다.");
    res.redirect(`/posts/${postId}#comments`);
  } catch (error) {
    req.flash("error", error.message || "댓글 등록 중 오류가 발생했습니다.");
    res.redirect(`/posts/${req.params.id}#comments`);
  }
};

/**
 * 댓글 삭제
 */
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // 게시물 조회
    const post = await postService.getPostById(postId);

    // 댓글 찾기
    const comment = post.comments.id(commentId);

    if (!comment) {
      req.flash("error", "댓글을 찾을 수 없습니다.");
      return res.redirect(`/posts/${postId}#comments`);
    }

    // 댓글 작성자 또는 관리자만 삭제 가능
    if (comment.author._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      req.flash("error", "댓글을 삭제할 권한이 없습니다.");
      return res.redirect(`/posts/${postId}#comments`);
    }

    // 서비스 호출
    await postService.deleteComment(postId, commentId);

    req.flash("success", "댓글이 삭제되었습니다.");
    res.redirect(`/posts/${postId}#comments`);
  } catch (error) {
    req.flash("error", error.message || "댓글 삭제 중 오류가 발생했습니다.");
    res.redirect(`/posts/${req.params.postId}#comments`);
  }
};

/**
 * 아카이브 페이지 (월별, 연도별 게시물)
 */
exports.getArchive = async (req, res) => {
  try {
    const { year, month } = req.query;

    // 아카이브 통계 데이터 조회
    const { archiveByYear } = await postService.getArchiveData();

    // 특정 연도/월 게시물 조회
    let filteredPosts = [];
    if (year) {
      filteredPosts = await postService.getPostsByYearMonth(year, month);
    }

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts } = await postService.getSidebarData();

    // 응답 렌더링
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
  } catch (error) {
    req.flash("error", error.message || "아카이브 데이터를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};
