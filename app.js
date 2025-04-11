const express = require("express");
const session = require("express-session");
const morgan = require("morgan");

const connectDB = require("./config/db");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
connectDB();

//middleware
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(morgan(process.env.NODE_ENV || "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const menuLoader = require("./middlewares/menuLoader");
const userLoader = require("./middlewares/userLoader");
app.use(userLoader);
app.use(menuLoader);

//뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//라우터
const indexRouter = require("./routes/index");
const postRouter = require("./routes/posts");
const categoryRouter = require("./routes/categories");
const tagRouter = require("./routes/tags");
const menuRouter = require("./routes/menus");
const authRouter = require("./routes/auth");

app.use("/", indexRouter);
app.use("/posts", postRouter);
app.use("/categories", categoryRouter);
app.use("/tags", tagRouter);
app.use("/menu", menuRouter);
app.use("/auth", authRouter);

//서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT} port`);
});
