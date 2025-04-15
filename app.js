const express = require("express");
const session = require("express-session");
const morgan = require("morgan");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

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
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "code.jquery.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "cdn.jsdelivr.net", "*.unsplash.com", "res.cloudinary.com", "*.cloudinary.com"],
        connectSrc: ["'self'"],
      },
    },
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
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // CSRF 공격 방지를 위한 sameSite 설정 추가
    },
  })
);
app.use(morgan(process.env.NODE_ENV || "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
  { path: "/auth/profile/image/delete", method: "GET" },
];

// CSRF 미들웨어 설정
const csrfProtection = csrf({ cookie: true });

// CSRF 미들웨어를 조건부로 적용
app.use((req, res, next) => {
  // 현재 요청이 CSRF 검증에서 제외되어야 하는지 확인
  const shouldExclude = csrfExcludedPaths.some((item) => item.path === req.path && item.method === req.method);

  if (shouldExclude) {
    return next();
  }

  // 다른 모든 경로는 CSRF 검증 적용
  csrfProtection(req, res, next);
});

// CSRF 토큰을 locals에 추가
app.use((req, res, next) => {
  if (req.csrfToken) {
    try {
      res.locals.csrfToken = req.csrfToken();
    } catch (err) {
      // csrfToken을 생성할 수 없는 경우 오류 무시
      console.log("CSRF 토큰 생성 오류 (무시됨):", err.message);
    }
  }
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

app.use("/", indexRouter);
app.use("/posts", postRouter);
app.use("/categories", categoryRouter);
app.use("/tags", tagRouter);
app.use("/menus", menuRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);

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
