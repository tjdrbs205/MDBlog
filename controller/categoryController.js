const Category = require("../models/Category");
const Post = require("../models/Post");
const Tag = require("../models/Tag");

exports.list = async (req, res) => {
  // 계층 구조로 카테고리 가져오기
  const rootCategories = await Category.getHierarchicalCategories();

  // 모든 카테고리도 함께 전달 (드롭다운용)
  const allCategories = await Category.find().sort({ name: 1 });

  res.render("categories/list", {
    title: "카테고리 관리",
    categories: rootCategories,
    allCategories,
  });
};

exports.create = async (req, res) => {
  const { name, description, parent, order } = req.body;

  try {
    // 부모 카테고리 ID가 있으면 설정하고, 없으면 null로 설정
    const categoryData = {
      name,
      description: description || "",
      parent: parent && parent !== "none" ? parent : null,
      order: order || 0,
    };

    await Category.create(categoryData);
    req.flash("success", "카테고리가 성공적으로 생성되었습니다");
    res.redirect("/admin/content#categories");
  } catch (error) {
    console.error("카테고리 생성 오류:", error);
    req.flash("error", "카테고리 생성 중 오류가 발생했습니다");
    res.redirect("/admin/content#categories");
  }
};

exports.filter = async (req, res) => {
  const categoryId = req.params.id;
  const { sort = "newest", q } = req.query; // 정렬 및 검색 파라미터 가져오기

  // 선택한 카테고리와 모든 하위 카테고리의 ID 배열 생성
  const categoryIds = [categoryId];

  // 하위 카테고리 찾기
  const childCategories = await Category.find({ parent: categoryId });
  childCategories.forEach((child) => {
    categoryIds.push(child._id);
  });

  // 정렬 옵션 설정
  let sortOption = { createdAt: -1 }; // 기본값 (최신순)

  if (sort === "oldest") {
    sortOption = { createdAt: 1 };
  } else if (sort === "title") {
    sortOption = { title: 1 };
  } else if (sort === "views") {
    sortOption = { view: -1 };
  }

  // 검색 필터 구성
  const filter = { category: { $in: categoryIds } };
  if (q) {
    filter.$or = [{ title: new RegExp(q, "i") }, { content: new RegExp(q, "i") }];
  }

  // 선택한 카테고리와 모든 하위 카테고리의 게시물 찾기
  const posts = await Post.find(filter)
    .populate("category")
    .populate("tags")
    .populate("author", "username")
    .sort(sortOption);

  const category = await Category.findById(categoryId);

  // 모든 카테고리 가져오기 (selectbox 용)
  const categories = await Category.find().sort({ name: 1 });

  // 모든 태그 가져오기 (필터링 및 표시용)
  const tags = await Tag.find().sort({ name: 1 });

  // 사이드바에 필요한 최근 게시물
  const recentPosts = await Post.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title createdAt featuredImage");

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

  res.render("layouts/main", {
    title: `카테고리: ${category.name}`,
    posts,
    categories,
    tags,
    recentPosts,
    categoryMap,
    currentCategory: category,
    selectedCategory: categoryId,
    sort, // 정렬 변수 설정
    q: q || "", // 검색어가 있다면 전달
    contentView: "posts/list", // 메인 레이아웃 안에 표시할 콘텐츠 뷰
  });
};

exports.update = async (req, res) => {
  const { id, name, description, parent, order } = req.body;

  try {
    // 먼저 카테고리 ID로 해당 카테고리를 찾습니다
    const category = await Category.findById(id);

    if (!category) {
      req.flash("error", "카테고리를 찾을 수 없습니다");
      return res.redirect("/admin/content#categories");
    }

    // 카테고리 자신을 부모로 설정하는 것을 방지
    if (parent && parent === id) {
      req.flash("error", "카테고리를 자기 자신의 하위로 설정할 수 없습니다");
      return res.redirect("/admin/content#categories");
    }

    // 순환 참조 방지 (A -> B -> A와 같은 구조 금지)
    if (parent) {
      let currentParent = await Category.findById(parent);
      while (currentParent && currentParent.parent) {
        if (currentParent.parent.toString() === id.toString()) {
          req.flash("error", "순환 참조가 발생합니다. 다른 상위 카테고리를 선택해주세요");
          return res.redirect("/admin/content#categories");
        }
        currentParent = await Category.findById(currentParent.parent);
      }
    }

    // 카테고리 업데이트
    category.name = name;
    category.description = description || "";
    category.parent = parent || null;
    category.order = order || 0;
    await category.save();

    req.flash("success", "카테고리가 성공적으로 업데이트되었습니다");
    res.redirect("/admin/content#categories");
  } catch (error) {
    console.error("카테고리 업데이트 오류:", error);
    req.flash("error", "카테고리 업데이트 중 오류가 발생했습니다");
    res.redirect("/admin/content#categories");
  }
};

exports.delete = async (req, res) => {
  const categoryId = req.params.id;

  try {
    // 1. 이 카테고리를 사용하는 게시물이 있는지 확인
    const postsWithCategory = await Post.countDocuments({ category: categoryId });

    if (postsWithCategory > 0) {
      req.flash("error", "이 카테고리를 사용하는 게시물이 있어 삭제할 수 없습니다");
      return res.redirect("/admin/content#categories");
    }

    // 2. 하위 카테고리가 있는지 확인
    const childCategories = await Category.countDocuments({ parent: categoryId });

    if (childCategories > 0) {
      req.flash(
        "error",
        "하위 카테고리가 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제해주세요"
      );
      return res.redirect("/admin/content#categories");
    }

    // 3. 카테고리 삭제
    await Category.findByIdAndDelete(categoryId);

    req.flash("success", "카테고리가 성공적으로 삭제되었습니다");
    res.redirect("/admin/content#categories");
  } catch (error) {
    console.error("카테고리 삭제 오류:", error);
    req.flash("error", "카테고리 삭제 중 오류가 발생했습니다");
    res.redirect("/admin/content#categories");
  }
};
