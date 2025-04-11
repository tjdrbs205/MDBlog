const Post = require("../models/post");

// 전체 게시글
exports.getAllPosts = async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.render("posts/list", { title: "모든 글", posts });
};

// 작성 폼
exports.renderNewForm = (req, res) => {
  res.render("posts/new", { title: "새 글 작성" });
};

// 글 저장
exports.createPost = async (req, res) => {
  const { title, body } = req.body;
  await Post.create({ title, body });
  res.redirect("/posts");
};

//글 상세 보기
exports.getPostDetail = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Not Found");
  res.render("posts/detail", { title: post.title, post });
};
