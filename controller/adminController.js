const User = require("../models/User");

/**
 * 사용자 목록 조회 (관리자용)
 */
exports.listUsers = async (req, res) => {
  const users = await User.find().sort({ username: 1 });

  res.render("layouts/main", {
    title: "사용자 관리",
    users,
    contentView: "admin/users",
  });
};

/**
 * 사용자 권한 변경 (관리자용)
 */
exports.changeUserRole = async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    req.flash("error", "사용자 ID와 역할이 필요합니다.");
    return res.redirect("/admin/users");
  }

  // 역할이 유효한지 확인
  if (!["user", "admin"].includes(role)) {
    req.flash("error", "유효하지 않은 역할입니다.");
    return res.redirect("/admin/users");
  }

  // 자기 자신의 관리자 권한을 제거하는 것을 방지
  if (userId === req.user._id.toString() && role !== "admin") {
    req.flash("error", "자신의 관리자 권한을 제거할 수 없습니다.");
    return res.redirect("/admin/users");
  }

  // 사용자 찾기
  const user = await User.findById(userId);

  if (!user) {
    req.flash("error", "사용자를 찾을 수 없습니다.");
    return res.redirect("/admin/users");
  }

  // 사용자 역할 변경
  user.role = role;
  await user.save();

  req.flash(
    "success",
    `${user.username} 사용자의 역할이 ${role}로 변경되었습니다.`
  );
  res.redirect("/admin/users");
};
