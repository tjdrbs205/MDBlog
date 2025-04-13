const Menu = require("../models/Menu");

module.exports = async (req, res, next) => {
  try {
    // isVisible이 true인 메뉴만 조회, order 오름차순으로 정렬
    res.locals.menus = await Menu.find({ isVisible: true }).sort({ order: 1 });
    next();
  } catch (err) {
    console.error("메뉴 로드 오류:", err);
    next(err); // 에러 핸들러로 전달
  }
};
