/**
 * Category Controller
 * 카테고리 관련 요청을 처리하는 컨트롤러
 */
const categoryService = require("../services/categoryService");
const postService = require("../services/postService");

/**
 * 카테고리 목록 조회
 */
exports.list = async (req, res) => {
  try {
    // API 요청인 경우 JSON 응답 형식 사용
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    if (isApiRequest) {
      // API 요청인 경우 카테고리 데이터 JSON으로 반환
      const categories = await categoryService.getHierarchicalCategories();
      const allCategories = await categoryService.getAllCategories();
      return res.json({ categories, allCategories });
    } else {
      // 일반 브라우저 요청인 경우 관리자 콘텐츠 페이지로 리다이렉트
      return res.redirect("/admin/content#categories");
    }
  } catch (error) {
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    if (isApiRequest) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "카테고리 목록을 불러오는 중 오류가 발생했습니다.",
      });
    }

    req.flash("error", error.message || "카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 카테고리 생성
 */
exports.create = async (req, res) => {
  try {
    // 카테고리 데이터 추출
    const { name, parent } = req.body;

    // 이름이 비어있는 경우 처리
    if (!name || !name.trim()) {
      req.flash("error", "카테고리 이름을 입력해주세요.");
      return res.redirect("/admin/content#categories");
    }

    // 서비스 호출
    await categoryService.createCategory({ name, parent });

    req.flash("success", "카테고리가 성공적으로 생성되었습니다.");
    res.redirect("/admin/content#categories");
  } catch (error) {
    req.flash("error", error.message || "카테고리 생성 중 오류가 발생했습니다.");
    res.redirect("/admin/content#categories");
  }
};

/**
 * 카테고리 업데이트
 */
exports.update = async (req, res) => {
  try {
    // 카테고리 데이터 추출
    const { id, name, parent } = req.body;

    // 필수 데이터 확인
    if (!id) {
      req.flash("error", "카테고리 ID가 필요합니다.");
      return res.redirect("/admin/content#categories");
    }

    if (!name || !name.trim()) {
      req.flash("error", "카테고리 이름을 입력해주세요.");
      return res.redirect("/admin/content#categories");
    }

    // 서비스 호출
    await categoryService.updateCategory(id, { name, parent });

    req.flash("success", "카테고리가 성공적으로 업데이트되었습니다.");
    res.redirect("/admin/content#categories");
  } catch (error) {
    req.flash("error", error.message || "카테고리 업데이트 중 오류가 발생했습니다.");
    res.redirect("/admin/content#categories");
  }
};

/**
 * 카테고리 삭제
 */
exports.delete = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // API 요청인 경우 JSON 응답 형식 사용
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    // 삭제 가능 여부 확인
    const { isDeletable, hasChildren, hasRelatedPosts } = await categoryService.checkCategoryDeletable(categoryId);

    if (!isDeletable) {
      const errorMessage = hasChildren
        ? "하위 카테고리가 있어 삭제할 수 없습니다."
        : "이 카테고리를 사용하는 게시물이 있어 삭제할 수 없습니다.";

      if (isApiRequest) {
        return res.status(400).json({ error: errorMessage });
      }

      req.flash("error", errorMessage);
      return res.redirect("/admin/content#categories");
    }

    // 서비스 호출
    await categoryService.deleteCategory(categoryId);

    if (isApiRequest) {
      return res.json({ success: "카테고리가 성공적으로 삭제되었습니다." });
    }

    req.flash("success", "카테고리가 성공적으로 삭제되었습니다.");
    res.redirect("/admin/content#categories");
  } catch (error) {
    const isApiRequest = req.xhr || req.headers.accept.includes("json");

    if (isApiRequest) {
      return res.status(error.statusCode || 500).json({
        error: error.message || "카테고리 삭제 중 오류가 발생했습니다.",
      });
    }

    req.flash("error", error.message || "카테고리 삭제 중 오류가 발생했습니다.");
    res.redirect("/admin/content#categories");
  }
};

/**
 * 특정 카테고리의 게시물 조회
 */
exports.filter = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // 서비스 호출
    const { posts, category, pagination } = await categoryService.getCategoryPosts(categoryId, {
      page,
      limit,
      includeSubcategories: true,
    });

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts, categoryMap } = await postService.getSidebarData();

    // 응답 렌더링
    res.render("layouts/main", {
      title: `카테고리: ${category.name}`,
      posts,
      categories,
      tags,
      recentPosts,
      categoryMap,
      selectedCategory: categoryId,
      pagination,
      contentView: "posts/list",
    });
  } catch (error) {
    req.flash("error", error.message || "카테고리 게시물을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/posts");
  }
};
