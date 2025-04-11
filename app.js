const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const path = require("path");
const dotenv = require("dotenv");

const postRouter = require("./routes/posts");

dotenv.config();
const app = express();
connectDB();

//middleware
app.use(morgan(process.env.NODE_ENV || "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

//뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//라우터
const indexRouter = require("./routes/index");
app.use("/", indexRouter);
app.use("/posts", postRouter);

//서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT} port`);
});
