/**
 * 글로벌 에러 핸들링 미들웨어
 * 애플리케이션 전체에서 발생하는 에러를 중앙에서 처리
 */
module.exports = (err, req, res, next) => {
  // 에러 로깅
  console.error("에러 발생:", err.stack);

  // 개발 환경에서만 상세 에러 표시 (운영 환경에서는 일반적인 에러 메시지 표시)
  const isDev = process.env.NODE_ENV !== "production";

  // 상태 코드 설정 (기본값 500)
  const statusCode = err.statusCode || 500;

  // JSON API 요청에는 JSON 응답, 아니면 에러 페이지 렌더링
  if (req.xhr || req.headers.accept.indexOf("json") > -1) {
    return res.status(statusCode).json({
      error: {
        message: isDev ? err.message : "서버 에러가 발생했습니다.",
        ...(isDev && { stack: err.stack }),
      },
    });
  }

  // 에러 페이지 렌더링 (views/error.ejs 템플릿 필요)
  res.status(statusCode);
  res.render("error", {
    message: isDev ? err.message : "서버 에러가 발생했습니다.",
    error: isDev ? err : {},
    status: statusCode,
  });
};
