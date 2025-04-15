/**
 * Auth Controller
 * 인증 관련 요청을 처리하는 컨트롤러
 */
const authService = require("../services/authService");
const postService = require("../services/postService");

/**
 * 로그인 페이지 렌더링
 */
exports.renderLogin = (req, res) => {
  // 이미 로그인한 사용자는 홈으로 리다이렉트
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  res.render("auth/login", {
    title: "로그인",
    error: req.flash("error"),
  });
};

/**
 * 로그인 처리
 * 참고: Passport 미들웨어는 라우터에서 처리되므로 직접 구현하지 않음
 */
exports.login = (req, res) => {
  // 로그인 성공 후 리다이렉트는 Passport에서 처리
  // 이 함수는 로그인 실패 시 처리를 위해 존재
  req.flash("error", "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
  res.redirect("/auth/login");
};

/**
 * 로그아웃 처리
 */
exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "로그아웃 되었습니다.");
    res.redirect("/");
  });
};

/**
 * 회원가입 페이지 렌더링
 */
exports.renderRegister = (req, res) => {
  // 이미 로그인한 사용자는 홈으로 리다이렉트
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  res.render("auth/register", {
    title: "회원가입",
    error: req.flash("error"),
  });
};

/**
 * 회원가입 처리
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm, displayName } = req.body;

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      req.flash("error", "비밀번호가 일치하지 않습니다.");
      return res.redirect("/auth/register");
    }

    // 서비스 호출
    await authService.registerUser({
      username,
      email,
      password,
      displayName,
    });

    req.flash("success", "회원가입이 완료되었습니다. 로그인해주세요.");
    res.redirect("/auth/login");
  } catch (error) {
    req.flash("error", error.message || "회원가입 중 오류가 발생했습니다.");
    res.redirect("/auth/register");
  }
};

/**
 * 프로필 페이지 렌더링
 */
exports.renderProfile = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    // 서비스 호출
    const user = await authService.getUserById(req.user._id);

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts } = await postService.getSidebarData();

    res.render("layouts/main", {
      title: "내 프로필",
      user,
      categories,
      tags,
      recentPosts,
      contentView: "auth/profile",
    });
  } catch (error) {
    req.flash("error", error.message || "프로필을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 프로필 업데이트 처리
 */
exports.updateProfile = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    const { displayName, bio, website } = req.body;

    // 서비스 호출
    await authService.updateProfile(req.user._id, {
      displayName,
      bio,
      website,
    });

    req.flash("success", "프로필이 성공적으로 업데이트되었습니다.");
    res.redirect("/auth/profile");
  } catch (error) {
    req.flash("error", error.message || "프로필 업데이트 중 오류가 발생했습니다.");
    res.redirect("/auth/profile");
  }
};

/**
 * 비밀번호 변경 페이지 렌더링
 */
exports.renderChangePassword = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts } = await postService.getSidebarData();

    res.render("layouts/main", {
      title: "비밀번호 변경",
      categories,
      tags,
      recentPosts,
      contentView: "auth/change-password",
    });
  } catch (error) {
    req.flash("error", error.message || "페이지를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/auth/profile");
  }
};

/**
 * 비밀번호 변경 처리
 */
exports.changePassword = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 새 비밀번호 확인
    if (newPassword !== confirmPassword) {
      req.flash("error", "새 비밀번호가 일치하지 않습니다.");
      return res.redirect("/auth/change-password");
    }

    // 서비스 호출
    await authService.changePassword(req.user._id, currentPassword, newPassword);

    req.flash("success", "비밀번호가 성공적으로 변경되었습니다.");
    res.redirect("/auth/profile");
  } catch (error) {
    req.flash("error", error.message || "비밀번호 변경 중 오류가 발생했습니다.");
    res.redirect("/auth/change-password");
  }
};
