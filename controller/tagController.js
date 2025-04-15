/**
 * Tag Controller
 * 태그 관련 요청을 처리하는 컨트롤러
 */
const tagService = require("../services/tagService");
const postService = require("../services/postService");

/**
 * 태그 목록 조회
 */
exports.list = async (req, res) => {
  try {
    // 태그 목록 조회
    const tags = await tagService.getAllTags();

    // 태그 사용 빈도 통계 조회
    const tagStats = await tagService.getTagStats();

    // 태그 목록에 사용 빈도 정보 추가
    const tagsWithCounts = tags.map((tag) => {
      const statItem = tagStats.find((stat) => stat._id.toString() === tag._id.toString());
      return {
        _id: tag._id,
        name: tag.name,
        count: statItem ? statItem.count : 0,
      };
    });

    // 응답 렌더링
    res.render("tags/list", {
      title: "태그 관리",
      tags: tagsWithCounts,
    });
  } catch (error) {
    req.flash("error", error.message || "태그 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 태그 생성
 */
exports.create = async (req, res) => {
  try {
    // 태그 데이터 추출
    const { name } = req.body;

    // 서비스 호출
    const tag = await tagService.createTag({ name });

    // API 요청인 경우 JSON 응답
    if (req.xhr || req.headers.accept.includes("json")) {
      return res.json({ success: true, tag });
    }

    req.flash("success", "태그가 성공적으로 생성되었습니다.");
    res.redirect("/tags");
  } catch (error) {
    // API 요청인 경우 JSON 응답
    if (req.xhr || req.headers.accept.includes("json")) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "태그 생성 중 오류가 발생했습니다.",
      });
    }

    req.flash("error", error.message || "태그 생성 중 오류가 발생했습니다.");
    res.redirect("/tags");
  }
};

/**
 * 태그 삭제
 */
exports.delete = async (req, res) => {
  try {
    const tagId = req.params.id;

    // API 요청인 경우 JSON 응답 형식 사용
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    // 삭제 가능 여부 확인
    const { isDeletable, hasRelatedPosts } = await tagService.checkTagDeletable(tagId);

    if (!isDeletable) {
      const errorMessage = "이 태그를 사용하는 게시물이 있어 삭제할 수 없습니다.";

      if (isApiRequest) {
        return res.status(400).json({ error: errorMessage });
      }

      req.flash("error", errorMessage);
      return res.redirect("/tags");
    }

    // 서비스 호출
    await tagService.deleteTag(tagId);

    if (isApiRequest) {
      return res.json({ success: "태그가 성공적으로 삭제되었습니다." });
    }

    req.flash("success", "태그가 성공적으로 삭제되었습니다.");
    res.redirect("/tags");
  } catch (error) {
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    if (isApiRequest) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "태그 삭제 중 오류가 발생했습니다.",
      });
    }

    req.flash("error", error.message || "태그 삭제 중 오류가 발생했습니다.");
    res.redirect("/tags");
  }
};

/**
 * 특정 태그의 게시물 조회
 */
exports.filter = async (req, res) => {
  try {
    const tagId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // 서비스 호출
    const { posts, tag, pagination } = await tagService.getTagPosts(tagId, {
      page,
      limit,
    });

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts, categoryMap } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: `태그: ${tag.name}`,
      posts,
      categories,
      tags,
      recentPosts,
      categoryMap,
      selectedTag: tagId,
      pagination,
      contentView: "posts/list",
    });
  } catch (error) {
    req.flash("error", error.message || "태그 게시물을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};
