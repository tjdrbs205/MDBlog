const express = require("express");
const session = require("express-session");
const morgan = require("morgan");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const passport = require("./config/passport"); // Passport 추가

const connectDB = require("./config/db");
const MongoStore = require("connect-mongo");
const path = require("path");
const dotenv = require("dotenv");

// 환경 변수 설정
dotenv.config();
const app = express();
connectDB();

// 보안 헤더 설정
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "cdn.jsdelivr.net",
          "code.jquery.com",
          "cdn.ckeditor.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com", "cdn.ckeditor.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
        imgSrc: [
          "'self'",
          "data:",
          "cdn.jsdelivr.net",
          "*.unsplash.com",
          "res.cloudinary.com",
          "*.cloudinary.com",
          "blob:",
          "cdn.ckeditor.com",
        ],
        connectSrc: ["'self'", "*.cloudinary.com", "cdn.ckeditor.com", "proxy-event.ckeditor.com"],
        mediaSrc: ["'self'", "data:", "blob:", "*.cloudinary.com"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// 미들웨어
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGOOSE_URI,
      collectionName: "sessions",
      ttl: 60 * 60, // 1시간 (초 단위)
      autoRemove: "native", // MongoDB의 TTL 인덱스 사용
    }),
    cookie: {
      maxAge: 1000 * 60 * 60, // 1시간 (밀리초 단위)
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // CSRF 공격 방지를 위한 sameSite 설정
    },
    name: "mdblog.sid", // 기본 이름인 connect.sid 대신 사용자 정의 이름 사용
  })
);

// Passport 초기화 - 세션 설정 바로 다음에 위치해야 함
app.use(passport.initialize());
app.use(passport.session());

app.use(morgan(process.env.NODE_ENV || "dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Flash 메시지 설정
app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error"),
    info: req.flash("info"),
  };
  next();
});

// 모든 뷰에 messages 변수를 전달
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// CSRF 보호 설정
// CSRF 검증에서 제외할 경로들
const csrfExcludedPaths = [
  { path: "/admin/settings/profile-image", method: "POST" },
  { path: "/auth/profile/image", method: "POST" },
  { path: "/auth/profile/image/delete", method: "POST" }, // GET에서 POST로 메서드 수정
  { path: "/api/upload/image", method: "POST" }, // CKEditor 이미지 업로드 API
];

// CSRF 미들웨어 설정
const csrfProtection = csrf({ cookie: true });

// CSRF 미들웨어를 조건부로 적용
app.use((req, res, next) => {
  // 현재 요청이 CSRF 검증에서 제외되어야 하는지 확인
  const shouldExclude = csrfExcludedPaths.some((item) => item.path === req.path && item.method === req.method);

  // 요청의 _csrf 토큰 디버깅 (body, query 또는 헤더에 있을 수 있음)
  console.log(`[CSRF 디버그] 요청 경로: ${req.method} ${req.path}`);
  console.log("[CSRF 디버그] 헤더:", req.headers["csrf-token"] || req.headers["x-csrf-token"] || "없음");

  // 배열로 전달된 CSRF 토큰 문제 해결 (첫 번째 값만 사용)
  if (req.body && req.body._csrf) {
    if (Array.isArray(req.body._csrf)) {
      console.log("[CSRF 디버그] 배열 형태의 토큰 감지됨, 첫 번째 값으로 변환");
      req.body._csrf = req.body._csrf[0];
    }
    console.log("[CSRF 디버그] 요청 본문 토큰:", req.body._csrf);
  }

  if (req.query && req.query._csrf) {
    if (Array.isArray(req.query._csrf)) {
      req.query._csrf = req.query._csrf[0];
    }
    console.log("[CSRF 디버그] 쿼리 토큰:", req.query._csrf);
  }

  if (shouldExclude) {
    // 제외된 경로는 CSRF 검증 없이 진행하지만, 토큰은 생성
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : "";
    return next();
  }

  // CSRF 미들웨어 적용
  csrfProtection(req, res, (err) => {
    if (err && err.code === "EBADCSRFTOKEN") {
      // 잘못된 CSRF 토큰 오류 처리
      console.error("[CSRF 오류] 잘못된 CSRF 토큰:", err.message);
      console.log("[CSRF 디버그] 쿠키 값:", req.cookies._csrf || "없음");
      console.log("[CSRF 디버그] 요청 본문:", req.body && req.body._csrf ? req.body._csrf : "없음");

      if (req.xhr || req.headers.accept?.includes("json")) {
        return res.status(403).json({ error: "CSRF 토큰이 유효하지 않습니다" });
      }

      req.flash("error", "CSRF 토큰이 유효하지 않습니다. 다시 시도해주세요.");
      return res.redirect("back");
    } else if (err) {
      console.error("CSRF 처리 오류:", err);
      return next(err);
    }

    try {
      // 성공적으로 CSRF 검증을 통과하면 토큰을 뷰에 전달
      const token = req.csrfToken();
      res.locals.csrfToken = token;
      res.locals.csrfMeta = `<meta name="csrf-token" content="${token}" />`;

      // 생성된 토큰 로깅
      console.log(`[CSRF 디버그] 생성된 토큰: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
      console.log("[CSRF 디버그] 쿠키 값:", req.cookies._csrf || "없음");

      next();
    } catch (tokenErr) {
      console.error("[CSRF 오류] 토큰 생성 오류:", tokenErr);
      next(tokenErr);
    }
  });
});

// CSRF 토큰을 locals에 추가
app.use((req, res, next) => {
  if (req.csrfToken) {
    try {
      res.locals.csrfToken = req.csrfToken();
      console.log("CSRF 토큰 생성 성공");
    } catch (err) {
      // csrfToken을 생성할 수 없는 경우 오류 무시
      console.error("CSRF 토큰 생성 오류:", err.message);
      console.error("오류 세부 정보:", err.stack);
    }
  } else {
    console.log("req.csrfToken 함수가 없음");
  }
  next();
});

// CKEditor 라이센스 키를 클라이언트에 안전하게 전달
app.use((req, res, next) => {
  // 개발 환경과 프로덕션 환경에 따라 적절한 라이센스 키 사용
  const isDev = process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development";
  res.locals.CKEDITOR_LICENSE_KEY = isDev
    ? process.env.CKEDITOR_LICENCE_KEY_DEV
    : process.env.CKEDITOR_LICENCE_KEY || "";
  next();
});

// 사용자 정의 미들웨어
const menuLoader = require("./middlewares/menuLoader");
const userLoader = require("./middlewares/userLoader");
const sidebarLoader = require("./middlewares/sidebarLoader");
const statsMiddleware = require("./middlewares/statsMiddleware"); // 통계 미들웨어 추가
const settingsLoader = require("./middlewares/settingsLoader"); // 설정 로더 미들웨어 추가

app.use(userLoader);
app.use(statsMiddleware); // 방문자 통계 미들웨어 추가
app.use(menuLoader);
app.use(sidebarLoader);
app.use(settingsLoader); // 설정 로더 미들웨어 추가

// 뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 라우터
const indexRouter = require("./routes/index");
const postRouter = require("./routes/posts");
const categoryRouter = require("./routes/categories");
const tagRouter = require("./routes/tags");
const menuRouter = require("./routes/menus");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api"); // API 라우터 추가

app.use("/", indexRouter);
app.use("/posts", postRouter);
app.use("/categories", categoryRouter);
app.use("/tags", tagRouter);
// app.use("/menus", menuRouter); // 사용하지 않는 라우터
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/api", apiRouter); // API 라우터 등록

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error("페이지를 찾을 수 없습니다");
  error.statusCode = 404;
  next(error);
});

// 에러 핸들러
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT} port`);
});
