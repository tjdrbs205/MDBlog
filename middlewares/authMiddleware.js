exports.isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
};

exports.isAuthor = (model) => {
  return async (req, res, next) => {
    const post = await model.findById(req.params.id);
    if (!post || String(post.author) !== String(req.session.user._id)) {
      return res.status(403).send("권한이 없습니다.");
    }
    next();
  };
};
