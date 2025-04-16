const User = require("../models/User");

/**
 * 로그인 여부 확인 미들웨어
 * 로그인이 필요한 라우트에 사용
 */
exports.isLoggedIn = (req, res, next) => {
  console.log("isLoggedIn 미들웨어 실행:", req.originalUrl);
  console.log("로그인 상태:", req.isAuthenticated ? req.isAuthenticated() : "isAuthenticated 함수 없음");

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // 로그인이 필요한 페이지 접근 시 메시지 표시
  req.flash("error", "로그인이 필요합니다.");
  console.log("로그인 필요 - 리다이렉트: /auth/login");
  return res.redirect("/auth/login");
};

/**
 * 로그인 상태 확인 미들웨어
 * 이미 로그인한 사용자가 접근하면 안 되는 라우트에 사용 (로그인, 회원가입 등)
 */
exports.isNotLoggedIn = (req, res, next) => {
  console.log("isNotLoggedIn 미들웨어 실행:", req.originalUrl);
  console.log("로그인 상태:", req.isAuthenticated ? req.isAuthenticated() : "isAuthenticated 함수 없음");

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next();
  }

  // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트
  console.log("이미 로그인됨 - 리다이렉트: /");
  return res.redirect("/");
};

/**
 * 콘텐츠 작성자만 접근 가능한 미들웨어
 */
exports.isAuthor = (model) => {
  return async (req, res, next) => {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    try {
      // 요청에서 id를 가져와서 문서 조회
      const document = await model.findById(req.params.id);
      if (!document) {
        req.flash("error", "문서가 존재하지 않습니다.");
        return res.status(404).redirect("back");
      }

      // 작성자와 현재 로그인한 사용자가 다른 경우
      if (String(document.author) !== String(req.user._id)) {
        req.flash("error", "권한이 없습니다.");
        return res.status(403).redirect("back");
      }

      req.document = document; // 요청 객체에 문서 저장
      next();
    } catch (err) {
      console.error("작성자 확인 미들웨어 오류:", err);
      req.flash("error", "서버 오류가 발생했습니다.");
      return res.status(500).redirect("back");
    }
  };
};

/**
 * 관리자만 접근 가능한 미들웨어
 */
exports.isAdmin = async (req, res, next) => {
  // 로그인 여부 확인
  if (!req.isAuthenticated()) {
    req.flash("error", "로그인이 필요합니다.");
    return res.redirect("/auth/login");
  }

  try {
    // 관리자인지 확인
    if (req.user.role !== "admin") {
      req.flash("error", "관리자만 접근할 수 있습니다.");
      return res.status(403).redirect("back");
    }

    next();
  } catch (err) {
    console.error("관리자 권한 확인 미들웨어 오류:", err);
    req.flash("error", "서버 오류가 발생했습니다.");
    return res.redirect("/auth/login");
  }
};
