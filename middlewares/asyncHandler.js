/**
 * 비동기 핸들러 유틸리티
 * async/await를 사용하는 라우트 핸들러에서 try/catch 블록을 제거하기 위한 래퍼 함수
 * @param {Function} fn - 비동기 라우트 핸들러 함수
 * @returns {Function} - Express 미들웨어 함수
 */
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
