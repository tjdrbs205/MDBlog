const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // 로그인 상태 확인을 위한 디버깅 정보
    console.log("userLoader 미들웨어 호출됨");
    console.log("req.user:", req.user ? `ID: ${req.user._id}` : "없음");
    console.log("req.session.passport:", req.session.passport ? JSON.stringify(req.session.passport) : "없음");

    // Passport가 제공하는 req.user 객체를 사용 (권장 방식)
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.locals.currentUser = req.user;
      console.log("인증된 사용자:", req.user.email);
    }
    // 세션에 직접 저장된 사용자 ID가 있는 경우 (이전 방식과의 호환성 유지)
    else if (req.session && req.session.user && req.session.user._id) {
      const user = await User.findById(req.session.user._id);
      res.locals.currentUser = user || null;
      console.log("세션에서 찾은 사용자:", user ? user.email : "없음");
    } else {
      res.locals.currentUser = null;
      console.log("인증되지 않은 상태");
    }

    // 로그인 상태를 모든 뷰에 전달
    res.locals.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    console.log("로그인 상태:", res.locals.isAuthenticated);

    next();
  } catch (err) {
    console.error("사용자 로드 오류:", err);
    next(err); // 에러 핸들러로 전달
  }
};
