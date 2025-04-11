const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");

exports.getAllPosts = async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.render("posts/list", { title: "모든 글", posts });
};

exports.renderNewForm = async (req, res) => {
  const categories = await Category.find();
  const tags = await Tag.find();
  res.render("posts/new", { title: "새 글 작성", categories, tags });
};

exports.createPost = async (req, res) => {
  const { title, body, category, tags } = req.body;
  const tagArray = tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  const tagIds = [];
  for (let tagName of tagArray) {
    let tag = await Tag.findOne({ name: tagName });
    if (!tag) tag = await Tag.create({ name: tagName });

    tagIds.push(tag._id);
  }
  await Post.create({ title, body, category, tags: tagIds });
  res.redirect("/posts");
};

exports.getPostDetail = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Not Found");
  res.render("posts/detail", { title: post.title, post });
};

exports.renderEditForm = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Not Found");
  res.render("posts/edit", { title: "글 수정", post });
};

exports.updatePost = async (req, res) => {
  const { title, body } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { title, body });
  res.redirect(`/posts/${req.params.id}`);
};

exports.deletePost = async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/posts");
};
