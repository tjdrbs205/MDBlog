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

// 수정 폼
exports.renderEditForm = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Not Found");
  res.render("posts/edit", { title: "글 수정", post });
};

// 글 수정 처리
exports.updatePost = async (req, res) => {
  const { title, body } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { title, body });
  res.redirect(`/posts/${req.params.id}`);
};

// 글 삭제
exports.deletePost = async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.redirect("/posts");
};
