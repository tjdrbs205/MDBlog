/**
 * Auth Controller
 * 인증 관련 요청을 처리하는 컨트롤러
 */
const authService = require("../services/authService");
const postService = require("../services/postService");
const fileService = require("../services/fileService"); // 파일 서비스 추가
const passport = require("passport");

/**
 * 로그인 페이지 렌더링
 */
exports.renderLogin = (req, res) => {
  console.log("renderLogin 함수 호출됨");
  console.log("현재 세션 정보:", req.session);
  console.log("인증 상태:", req.isAuthenticated ? req.isAuthenticated() : "isAuthenticated 함수 없음");

  // 이미 로그인한 사용자는 홈으로 리다이렉트
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("이미 로그인한 사용자의 로그인 페이지 접근 시도 - 홈으로 리다이렉트");
    return res.redirect("/");
  }

  // 플래시 메시지 확인
  console.log("에러 플래시 메시지:", req.flash("error"));

  console.log("로그인 페이지 렌더링");
  // 로그인 페이지를 렌더링할 때 필요한 데이터를 전달
  res.render("auth/login", {
    title: "로그인",
    error: req.flash("error"),
    email: req.body ? req.body.email : "",
  });
};

/**
 * 로그인 처리
 * Passport.js를 사용해 인증 처리
 */
exports.login = (req, res, next) => {
  console.log("로그인 시도:", req.body.email);
  console.log("세션 ID:", req.sessionID);

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("로그인 처리 오류:", err);
      return next(err);
    }

    if (!user) {
      // 인증 실패 시 보안을 위해 일관된 오류 메시지 표시
      console.log("로그인 실패:", info.message);
      // 내부적으로는 실제 오류 로깅
      console.log("실제 오류 원인:", info.message);

      // 사용자에게는 일반적인 메시지만 표시
      const genericErrorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";

      return res.render("auth/login", {
        title: "로그인",
        error: [genericErrorMessage],
        email: req.body.email || "",
      });
    }

    // 로그인 처리
    req.logIn(user, (err) => {
      if (err) {
        console.error("세션 저장 오류:", err);
        return next(err);
      }

      console.log("로그인 성공:", user.email);
      console.log(
        "세션에 저장된 사용자 ID:",
        req.session.passport ? req.session.passport.user : "세션에 사용자 ID 없음"
      );
      console.log("req.user 객체:", req.user ? `ID: ${req.user._id}, Email: ${req.user.email}` : "사용자 객체 없음");

      // 명시적으로 세션 저장 호출
      req.session.save((err) => {
        if (err) {
          console.error("세션 저장 중 오류:", err);
          return next(err);
        }

        // 로그인 성공 메시지 추가
        req.flash("success", "로그인 되었습니다.");

        // 홈 페이지로 리다이렉트 (명시적인 경로 설정)
        return res.redirect("/");
      });
    });
  })(req, res, next);
};

/**
 * 로그아웃 처리
 */
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("로그아웃 중 오류:", err);
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
      // 리다이렉트 대신 직접 렌더링
      return res.render("auth/register", {
        title: "회원가입",
        error: ["비밀번호가 일치하지 않습니다."],
        user: { username, email, displayName }, // 사용자가 입력한 데이터 유지
      });
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
    // 리다이렉트 대신 직접 렌더링
    return res.render("auth/register", {
      title: "회원가입",
      error: [error.message || "회원가입 중 오류가 발생했습니다."],
      user: { username: req.body.username, email: req.body.email, displayName: req.body.displayName }, // 사용자가 입력한 데이터 유지
    });
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

    // 사용자의 게시물 수 가져오기
    const postCount = await postService.getUserPostCount(req.user._id);

    // 마지막 로그인 시간 (사용자 모델에 lastLogin 필드가 있다고 가정)
    const lastLogin = user.lastLogin || null;

    // 사이드바 데이터 조회
    const { categories, tags, recentPosts } = await postService.getSidebarData();

    res.render("layouts/main", {
      title: "내 프로필",
      user,
      categories,
      tags,
      recentPosts,
      contentView: "auth/profile",
      postCount,
      lastLogin,
      errors: req.flash("error"),
      csrfToken: req.csrfToken ? req.csrfToken() : undefined,
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

/**
 * 프로필 이미지 업로드 처리
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    if (!req.file) {
      req.flash("error", "업로드할 이미지를 선택해주세요.");
      return res.redirect("/auth/profile");
    }

    // 서비스 레이어를 통해 이미지 업로드 처리
    await fileService.uploadUserProfileImage(req.user._id, req.file.buffer);

    req.flash("success", "프로필 이미지가 업데이트되었습니다.");
    res.redirect("/auth/profile");
  } catch (error) {
    console.error("프로필 이미지 업로드 오류:", error);
    req.flash("error", error.message || "이미지 업로드 중 오류가 발생했습니다.");
    res.redirect("/auth/profile");
  }
};

/**
 * 프로필 이미지 삭제 처리
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    // 로그인 여부 확인
    if (!req.isAuthenticated()) {
      req.flash("error", "로그인이 필요합니다.");
      return res.redirect("/auth/login");
    }

    // 서비스 레이어를 통해 이미지 삭제 처리
    await fileService.deleteUserProfileImage(req.user._id);

    req.flash("success", "프로필 이미지가 초기화되었습니다.");
    res.redirect("/auth/profile");
  } catch (error) {
    console.error("프로필 이미지 삭제 오류:", error);
    req.flash("error", error.message || "이미지 삭제 중 오류가 발생했습니다.");
    res.redirect("/auth/profile");
  }
};
