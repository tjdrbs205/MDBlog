const Category = require("../models/Category");
const Post = require("../models/Post");

exports.list = async (req, res) => {
  const categories = await Category.find();
  res.render("categories/list", { title: "카테고리 관리", categories });
};

exports.create = async (req, res) => {
  const { name } = req.body;
  await Category.create({ name });
  res.redirect("/categories");
};

exports.filter = async (req, res) => {
  const categoryId = req.params.id;
  const posts = await Post.find({ category: categoryId })
    .populate("category")
    .populate("tags")
    .sort({ createdAt: -1 });

  const category = await Category.findById(categoryId);
  res.render("posts/list", { title: `카테고리: ${category.name}`, posts });
};
