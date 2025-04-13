const User = require("../models/User");

/**
 * 회원가입 폼 렌더링
 */
exports.renderRegisterForm = (req, res) => {
  res.render("auth/register", {
    title: "회원가입",
    user: {}, // 빈 사용자 객체 (폼 재사용을 위해)
  });
};

/**
 * 회원가입 처리
 */
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // 기본 유효성 검사
  const validationErrors = [];

  if (!username || !email || !password) {
    validationErrors.push("모든 필드를 채워주세요.");
  }

  if (password !== confirmPassword) {
    validationErrors.push("비밀번호가 일치하지 않습니다.");
  }

  if (password && password.length < 6) {
    validationErrors.push("비밀번호는 최소 6자 이상이어야 합니다.");
  }

  // 유효성 검사 에러가 있을 경우
  if (validationErrors.length > 0) {
    return res.render("auth/register", {
      title: "회원가입",
      errors: validationErrors,
      user: { username, email }, // 기존 입력값 유지
    });
  }

  // 사용자명 중복 검사
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.render("auth/register", {
      title: "회원가입",
      errors: ["이미 사용 중인 사용자 이름입니다."],
      user: { username, email },
    });
  }

  // 이메일 중복 검사
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.render("auth/register", {
      title: "회원가입",
      errors: ["이미 사용 중인 이메일입니다."],
      user: { username, email },
    });
  }

  // 새 사용자 생성
  await User.create({
    username,
    email,
    password,
    role: "user", // 기본 역할 설정
  });

  req.flash("success", "가입이 완료되었습니다. 로그인해주세요.");
  res.redirect("/auth/login");
};

/**
 * 로그인 폼 렌더링
 */
exports.renderLoginForm = (req, res) => {
  res.render("auth/login", {
    title: "로그인",
    username: "", // 기본값 설정
  });
};

/**
 * 로그인 처리
 */
exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;

  // 입력값 유효성 검사
  if (!username || !password) {
    return res.render("auth/login", {
      title: "로그인",
      errors: ["사용자 이름과 비밀번호를 입력해주세요."],
      username,
    });
  }

  // 사용자 조회
  const user = await User.findOne({
    $or: [{ username }, { email: username }], // 사용자 이름 또는 이메일로 로그인 가능
  });

  // 사용자가 없거나 비밀번호가 일치하지 않는 경우
  if (!user || !(await user.comparePassword(password))) {
    return res.render("auth/login", {
      title: "로그인",
      errors: ["아이디 또는 비밀번호가 일치하지 않습니다."],
      username,
    });
  }

  // 세션에 사용자 정보 저장
  req.session.user = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // 자동 로그인 설정 (Remember me)
  if (rememberMe) {
    // 쿠키 만료 시간을 30일로 설정
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  req.flash("success", `${user.username}님, 환영합니다!`);

  // 이전 페이지가 있다면 해당 페이지로, 없으면 홈으로 리다이렉트
  const redirectUrl = req.session.returnTo || "/";
  delete req.session.returnTo;

  res.redirect(redirectUrl);
};

/**
 * 로그아웃 처리
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("로그아웃 중 오류 발생:", err);
    }
    // 세션 쿠키 삭제
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

/**
 * 비밀번호 찾기 폼 렌더링
 */
exports.renderForgotPasswordForm = (req, res) => {
  res.render("auth/forgot-password", {
    title: "비밀번호 찾기",
    email: "",
  });
};

/**
 * 비밀번호 찾기 처리 (이메일 발송)
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render("auth/forgot-password", {
      title: "비밀번호 찾기",
      errors: ["이메일을 입력해주세요."],
      email,
    });
  }

  // 해당 이메일로 사용자 조회
  const user = await User.findOne({ email });

  // 사용자가 없어도 보안을 위해 성공 메시지 표시 (이메일이 존재하는지 여부를 노출하지 않기 위함)
  if (!user) {
    req.flash(
      "success",
      "비밀번호 재설정 안내 이메일이 발송되었습니다. 이메일을 확인해주세요."
    );
    return res.redirect("/auth/login");
  }

  // TODO: 비밀번호 재설정 토큰 생성 및 이메일 발송 로직 구현
  // 현재는 실제 이메일 발송 없이 성공 메시지만 표시

  req.flash(
    "success",
    "비밀번호 재설정 안내 이메일이 발송되었습니다. 이메일을 확인해주세요."
  );
  res.redirect("/auth/login");
};

/**
 * 프로필 페이지 렌더링
 */
exports.renderProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  res.render("layouts/main", {
    title: "내 프로필",
    user,
    contentView: "auth/profile", // 경로 수정 (../auth/profile -> auth/profile)
  });
};

/**
 * 프로필 업데이트
 */
exports.updateProfile = async (req, res) => {
  const { username, email, bio } = req.body;
  const userId = req.user._id;

  // 입력값 유효성 검사
  if (!username || !email) {
    return res.render("auth/profile", {
      title: "내 프로필",
      errors: ["사용자 이름과 이메일은 필수입니다."],
      user: { ...req.user, username, email, bio },
    });
  }

  // 사용자 업데이트
  const user = await User.findById(userId);

  // 중복 검사 (다른 사용자와 중복되지 않는지)
  if (username !== user.username) {
    const existingUsername = await User.findOne({
      username,
      _id: { $ne: userId },
    });
    if (existingUsername) {
      return res.render("auth/profile", {
        title: "내 프로필",
        errors: ["이미 사용 중인 사용자 이름입니다."],
        user: { ...user.toObject(), username, email, bio },
      });
    }
  }

  if (email !== user.email) {
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.render("auth/profile", {
        title: "내 프로필",
        errors: ["이미 사용 중인 이메일입니다."],
        user: { ...user.toObject(), username, email, bio },
      });
    }
  }

  // 사용자 정보 업데이트
  user.username = username;
  user.email = email;
  user.bio = bio;

  await user.save();

  // 세션 업데이트
  req.session.user = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  req.flash("success", "프로필이 성공적으로 업데이트되었습니다.");
  res.redirect("/auth/profile");
};

/**
 * 비밀번호 변경 폼 렌더링
 */
exports.renderChangePasswordForm = (req, res) => {
  res.render("auth/change-password", {
    title: "비밀번호 변경",
  });
};

/**
 * 비밀번호 변경 처리
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 입력값 유효성 검사
  const validationErrors = [];

  if (!currentPassword || !newPassword || !confirmPassword) {
    validationErrors.push("모든 필드를 채워주세요.");
  }

  if (newPassword !== confirmPassword) {
    validationErrors.push("새 비밀번호가 일치하지 않습니다.");
  }

  if (newPassword && newPassword.length < 6) {
    validationErrors.push("비밀번호는 최소 6자 이상이어야 합니다.");
  }

  if (validationErrors.length > 0) {
    return res.render("auth/change-password", {
      title: "비밀번호 변경",
      errors: validationErrors,
    });
  }

  // 사용자 조회 및 현재 비밀번호 확인
  const user = await User.findById(req.user._id);

  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.render("auth/change-password", {
      title: "비밀번호 변경",
      errors: ["현재 비밀번호가 일치하지 않습니다."],
    });
  }

  // 비밀번호 업데이트
  user.password = newPassword;
  await user.save();

  req.flash("success", "비밀번호가 성공적으로 변경되었습니다.");
  res.redirect("/auth/profile");
};
