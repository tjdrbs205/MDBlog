const Menu = require("../models/Menu");

module.exports = async (req, res, next) => {
  res.locals.menus = await Menu.find({ isVisible: true }).sort({ order: 1 });
  next();
};
