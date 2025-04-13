const Menu = require("../models/Menu");

exports.list = async (req, res) => {
  const menus = await Menu.find().sort({ order: 1 });
  res.render("menus/list", { menus });
};

exports.create = async (req, res) => {
  const { title, url, order } = req.body;
  await Menu.create({ title, url, order });
  res.redirect("/menus");
};

exports.delete = async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.redirect("/menus");
};
