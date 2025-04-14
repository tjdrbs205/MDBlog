// middlewares/statsMiddleware.js
const Stats = require("../models/Stats");
const Visitor = require("../models/Visitor");
const asyncHandler = require("./asyncHandler");
const crypto = require("crypto");
const isbot = require("isbot"); // 봇 감지 라이브러리 추가
const geoip = require("geoip-lite"); // IP 기반 지역 정보 라이브러리 추가

// isbot이 객체인 경우 함수로 변환
const isBotCheck = typeof isbot === "function" ? isbot : isbot.isbot;

// 미들웨어에서 사용할 상수
const VISITOR_COOKIE_NAME = "visitor_id";
const VISIT_THRESHOLD_MINUTES = 30; // 같은 방문으로 간주할 시간 (분)

/**
 * 방문자 식별을 위한 해시 생성 함수
 * IP와 유저 에이전트를 조합하여 고유한 해시 생성
 */
const generateVisitorHash = (ip, userAgent) => {
  const data = `${ip}-${userAgent}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * 방문자 브라우저 종류 추출 함수
 */
const getBrowserInfo = (userAgent) => {
  if (!userAgent) return "unknown";

  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "IE";

  return "other";
};

/**
 * IP 주소에서 국가/지역 정보 추출 함수
 */
const getRegionInfo = (ip) => {
  try {
    // 로컬 IP 주소 처리
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "local";
    }

    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      return geo.country;
    }
  } catch (error) {
    console.error("지역 정보 조회 중 오류:", error);
  }

  return "unknown";
};

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
    req.path.startsWith("/admin") ||
    req.path.includes("favicon")
  ) {
    return next();
  }

  try {
    // 방문자 유저 에이전트
    const userAgent = req.headers["user-agent"] || "";

    // 봇 트래픽 필터링 추가 - 봇으로 감지된 경우 통계에서 제외
    if (isBotCheck(userAgent)) {
      return next();
    }

    // 방문자 IP 주소 (X-Forwarded-For 헤더 또는 원격 주소 사용)
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.connection.remoteAddress;

    // 방문한 경로
    const path = req.path;

    // 브라우저 정보 추출
    const browser = getBrowserInfo(userAgent);

    // 지역 정보 추출
    const region = getRegionInfo(ip);

    // 방문자 식별자 쿠키 확인
    let visitorId = req.cookies[VISITOR_COOKIE_NAME];
    let isNewVisitor = false;

    // 쿠키가 없는 경우, 새로운 식별자 생성
    if (!visitorId) {
      visitorId = generateVisitorHash(ip, userAgent);

      // 쿠키 설정 (1년 유효기간)
      res.cookie(VISITOR_COOKIE_NAME, visitorId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      });

      isNewVisitor = true;
    }

    // 방문자 정보 객체
    const visitorInfo = {
      visitorId,
      ip,
      userAgent,
      path,
      browser,
      region,
      isDuplicate: false,
    };

    // 방문자 DB에서 해당 방문자 조회
    let visitor = await Visitor.findOne({ visitorId });

    if (visitor) {
      // 기존 방문자인 경우, 마지막 방문 시간 확인
      const lastVisitTime = new Date(visitor.lastVisit).getTime();
      const currentTime = Date.now();
      const minutesDiff = (currentTime - lastVisitTime) / (1000 * 60);

      // 지정된 시간 내에 재방문한 경우, 중복 방문으로 처리
      if (minutesDiff < VISIT_THRESHOLD_MINUTES) {
        visitorInfo.isDuplicate = true;
      }

      // 방문자 정보 업데이트
      await Visitor.findByIdAndUpdate(visitor._id, {
        lastVisit: Date.now(),
        region: region, // 지역 정보 업데이트
        $inc: { visitCount: visitorInfo.isDuplicate ? 0 : 1 },
      });
    } else {
      // 신규 방문자인 경우, DB에 추가
      visitor = await Visitor.create({
        visitorId,
        ip,
        userAgent,
        region: region, // 지역 정보 추가
        lastVisit: Date.now(),
        firstVisit: Date.now(),
        visitCount: 1,
      });

      isNewVisitor = true;
    }

    // 통계 업데이트
    await Stats.incrementVisit(visitorInfo, isNewVisitor);

    // 실시간 방문자 정보를 전역 객체에 저장 (메모리에 임시 저장)
    if (global.activeVisitors === undefined) {
      global.activeVisitors = new Map();
    }

    // 방문자 정보 저장 (30분 후 자동 만료)
    global.activeVisitors.set(visitorId, {
      time: Date.now(),
      path: path,
      browser: browser,
      region: region,
    });

    // 오래된 방문자 정보 제거 (30분 이상 지난 항목)
    const expireTime = Date.now() - VISIT_THRESHOLD_MINUTES * 60 * 1000;
    for (const [vid, data] of global.activeVisitors.entries()) {
      if (data.time < expireTime) {
        global.activeVisitors.delete(vid);
      }
    }
  } catch (error) {
    console.error("방문자 통계 추적 중 오류:", error);
    // 통계 추적에 실패해도 사용자 경험에 영향이 없도록 에러를 무시하고 계속 진행
  }

  next();
});

module.exports = statsMiddleware;
