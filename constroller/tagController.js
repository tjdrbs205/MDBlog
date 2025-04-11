const Tag = require("../models/Tag");
const Post = require("../models/Post");

exports.list = async (req, res) => {
  const tags = await Tag.find();
  res.render("tags/list", { title: "태그 관리", tags });
};

exports.create = async (req, res) => {
  const { name } = req.body;
  if (name.trim() === "") return res.redirect("/tags");

  const exists = await Tag.findOne({ name });
  if (!exists) await Tag.create({ name });

  res.redirect("/tags");
};

exports.filter = async (req, res) => {
  const tagId = req.params.id;
  const posts = await Post.find({ tags: tagId })
    .populate("category")
    .populate("tags")
    .sort({ createdAt: -1 });

  const tag = await Tag.findById(tagId);
  res.render("posts/list", {
    title: `태그: #${tag.name}`,
    posts,
  });
};
