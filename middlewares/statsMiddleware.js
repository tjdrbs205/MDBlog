// middlewares/statsMiddleware.js
const Stats = require("../models/Stats");
const asyncHandler = require("./asyncHandler");

/**
 * 방문자 통계를 추적하는 미들웨어
 * 각 요청마다 방문자 통계를 업데이트
 */
const statsMiddleware = asyncHandler(async (req, res, next) => {
  // 정적 파일이나 API 요청, 관리자 페이지 등은 제외
  if (
    req.path.startsWith("/css") ||
    req.path.startsWith("/js") ||
    req.path.startsWith("/images") ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/admin")
  ) {
    return next();
  }

  // 세션 ID를 사용해서 방문자 구분
  // 실제 운영 환경에서는 IP, 브라우저 정보 등을 조합하여 더 정확한 구분이 필요
  const sessionId = req.session?.id;

  try {
    // 방문자 카운트 증가
    await Stats.incrementVisit(sessionId);
  } catch (error) {
    console.error("방문자 통계 추적 중 오류:", error);
    // 통계 추적에 실패해도 사용자 경험에 영향이 없도록 에러를 무시하고 계속 진행
  }

  next();
});

module.exports = statsMiddleware;
