const Category = require("../models/Category");
const Post = require("../models/Post");

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
  const { name, description, parent } = req.body;

  // 부모 카테고리 ID가 있으면 설정하고, 없으면 null로 설정
  const categoryData = {
    name,
    description: description || "",
    parent: parent && parent !== "none" ? parent : null,
  };

  await Category.create(categoryData);
  res.redirect("/categories");
};

exports.filter = async (req, res) => {
  const categoryId = req.params.id;

  // 선택한 카테고리와 모든 하위 카테고리의 ID 배열 생성
  const categoryIds = [categoryId];

  // 하위 카테고리 찾기
  const childCategories = await Category.find({ parent: categoryId });
  childCategories.forEach((child) => {
    categoryIds.push(child._id);
  });

  // 선택한 카테고리와 모든 하위 카테고리의 게시물 찾기
  const posts = await Post.find({ category: { $in: categoryIds } })
    .populate("category")
    .populate("tags")
    .sort({ createdAt: -1 });

  const category = await Category.findById(categoryId);
  res.render("posts/list", {
    title: `카테고리: ${category.name}`,
    posts,
    currentCategory: category,
  });
};
