/**
 * 유효성 검사 결과를 처리하는 미들웨어
 * Express Validator의 결과를 확인하고 오류가 있으면 처리
 */
const { validationResult } = require("express-validator");

/**
 * 유효성 검사 미들웨어
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
module.exports = (req, res, next) => {
  // validationResult 함수로 유효성 검사 결과 확인
  const errors = validationResult(req);

  // 유효성 검사 오류가 있는 경우
  if (!errors.isEmpty()) {
    // API 요청인 경우 JSON 응답
    if (req.xhr || req.headers.accept.includes("json")) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    // 폼 제출 등의 일반 요청인 경우
    // 첫 번째 오류 메시지를 플래시 메시지로 설정
    const errorMessages = errors.array().map((err) => err.msg);
    req.flash("error", errorMessages[0]);

    // 이전 입력값을 세션에 저장 (폼 재사용 시 활용)
    req.session.oldInput = req.body;

    // 이전 URL로 리디렉션 (referer가 없으면 홈으로)
    return res.redirect(req.get("referer") || "/");
  }

  // 오류가 없으면 다음 미들웨어로 진행
  next();
};
