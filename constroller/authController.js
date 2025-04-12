const User = require("../models/User");

exports.renderNewUserForm = (req, res) => {
  res.render("auth/register");
};

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists)
    return res.render("auth/register", { error: "이미 존재하는 유저입니다." });
  await User.create({ username, password });
  res.redirect("/auth/login");
};

exports.renderLoginForm = (req, res) => {
  res.render("auth/login");
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.send("아이디 또는 비밀번호가 틀렸습니다.");
  }
  req.session.user = {
    _id: user._id,
    username: user.username,
  };
  res.redirect("/");
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
