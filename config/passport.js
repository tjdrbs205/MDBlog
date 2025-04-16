/**
 * Passport 설정 파일
 * 다양한 인증 전략을 설정합니다.
 */
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");
const bcrypt = require("bcrypt");

// 로컬 전략 설정
passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // 사용자 이름 필드를 'email'로 설정
      passwordField: "password", // 비밀번호 필드 이름
    },
    async (email, password, done) => {
      try {
        // 이메일로 사용자 찾기
        const user = await User.findOne({ email });

        // 사용자가 존재하지 않는 경우
        if (!user) {
          return done(null, false, { message: "등록되지 않은 이메일입니다." });
        }

        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password);

        // 비밀번호가 일치하지 않는 경우
        if (!isMatch) {
          return done(null, false, { message: "비밀번호가 일치하지 않습니다." });
        }

        // 인증 성공
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 세션에 사용자 정보 저장
passport.serializeUser((user, done) => {
  done(null, user.id); // 사용자 ID만 세션에 저장
});

// 세션에 저장된 정보를 통해 사용자 객체 복원
passport.deserializeUser(async (id, done) => {
  try {
    // 필요한 필드만 명시적으로 선택하여 사용자 정보 조회
    const user = await User.findById(id).select(
      "_id username email displayName profileImage bio role isActive lastLogin"
    );
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
