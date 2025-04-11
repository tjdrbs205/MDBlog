const express = require("express");
const router = express.Router();

// 메인 페이지 렌더
router.get("/", async (req, res) => {
  res.render("index", { title: "나의 개발 블로그" });
});

module.exports = router;
