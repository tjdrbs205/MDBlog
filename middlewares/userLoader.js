const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // 세션에 사용자 정보가 있는 경우, DB로부터 실제 사용자 정보를 조회
    if (req.session && req.session.user) {
      const user = await User.findById(req.session.user._id);
      res.locals.currentUser = user || null;
    } else {
      // 세션이 없거나 사용자 정보가 없는 경우 null 할당
      res.locals.currentUser = null;
    }

    next();
  } catch (err) {
    console.error("사용자 로드 오류:", err);
    next(err); // 에러 핸들러로 전달
  }
};
