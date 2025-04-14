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
        imgSrc: ["'self'", "data:", "cdn.jsdelivr.net", "*.unsplash.com"],
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

// CSRF 보호 설정
app.use(
  csrf({
    cookie: true,
    ignoreMethods: ["GET", "HEAD", "OPTIONS"], // GET, HEAD, OPTIONS 메서드는 CSRF 검사 제외
  })
);

// CSRF 에러 처리 미들웨어 추가
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    req.flash(
      "error",
      "CSRF 보안 토큰이 유효하지 않습니다. 페이지를 새로고침한 후 다시 시도해주세요."
    );
    return res.redirect("back");
  }
  next(err);
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// 사용자 정의 미들웨어
const menuLoader = require("./middlewares/menuLoader");
const userLoader = require("./middlewares/userLoader");
const sidebarLoader = require("./middlewares/sidebarLoader");
const statsMiddleware = require("./middlewares/statsMiddleware"); // 통계 미들웨어 추가

app.use(userLoader);
app.use(statsMiddleware); // 방문자 통계 미들웨어 추가
app.use(menuLoader);
app.use(sidebarLoader);

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
