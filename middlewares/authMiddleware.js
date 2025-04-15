const User = require("../models/User");

exports.isLoggedIn = async (req, res, next) => {
  // 세션이 없는 경우 로그인 페이지로 이동
  if (!req.session || !req.session.user) {
    return res.redirect("/auth/login");
  }

  try {
    // 세션에 있는 사용자 정보로 DB 조회
    const user = await User.findById(req.session.user._id);
    if (!user) {
      // 사용자가 DB에 없는 경우 세션 삭제 후 로그인 페이지로 이동
      req.session.destroy();
      return res.redirect("/auth/login");
    }
    req.user = user; // 요청 객체에 사용자 정보를 저장
    next();
  } catch (err) {
    console.error("인증 미들웨어 오류:", err);
    return res.redirect("/auth/login");
  }
};

// 로그인하지 않은 사용자만 접근 가능한 미들웨어
exports.isNotLoggedIn = (req, res, next) => {
  // 세션이 있고 사용자가 로그인 한 경우 메인 페이지로 리다이렉트
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  // 로그인하지 않은 경우 다음 미들웨어로 진행
  next();
};

exports.isAuthor = (model) => {
  return async (req, res, next) => {
    // 세션이 없는 경우 바로 차단
    if (!req.session || !req.session.user) {
      return res.redirect("/auth/login");
    }

    try {
      // 요청에서 id를 가져와서 문서 조회
      const document = await model.findById(req.params.id);
      if (!document) {
        return res.status(404).send("문서가 존재하지 않습니다.");
      }

      // 작성자와 세션 사용자가 다른 경우 권한 없음
      // MongoDB ObjectId는 문자열로 비교해야 함
      if (String(document.author) !== String(req.session.user._id)) {
        return res.status(403).send("권한이 없습니다.");
      }

      req.document = document; // 요청 객체에 문서 저장 (선택사항)
      next();
    } catch (err) {
      console.error("작성자 확인 미들웨어 오류:", err);
      return res.status(500).send("서버 에러가 발생했습니다.");
    }
  };
};

// 관리자만 접근 가능한 미들웨어 추가
exports.isAdmin = async (req, res, next) => {
  // 세션이 없는 경우 로그인 페이지로 이동
  if (!req.session || !req.session.user) {
    return res.redirect("/auth/login");
  }

  try {
    // 세션에 있는 사용자 정보로 DB 조회
    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.session.destroy();
      return res.redirect("/auth/login");
    }

    // 관리자인지 확인
    if (user.role !== "admin") {
      return res.status(403).send("관리자만 접근할 수 있습니다.");
    }

    req.user = user; // 요청 객체에 사용자 정보를 저장
    next();
  } catch (err) {
    console.error("관리자 권한 확인 미들웨어 오류:", err);
    return res.redirect("/auth/login");
  }
};
