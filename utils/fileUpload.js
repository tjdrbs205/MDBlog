/**
 * 파일 업로드 유틸리티
 * 이미지 업로드를 위한 multer 설정 및 관련 유틸리티 함수를 제공합니다.
 */
const multer = require("multer");
const { Readable } = require("stream");

// 메모리 저장소 설정
const storage = multer.memoryStorage();

// 이미지 업로드를 위한 multer 인스턴스 생성
const imageUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드할 수 있습니다."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

/**
 * 버퍼를 스트림으로 변환
 * @param {Buffer} buffer - 변환할 버퍼
 * @returns {Readable} - 읽기 가능 스트림
 */
function bufferToStream(buffer) {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readable;
}

module.exports = {
  imageUpload,
  bufferToStream,
};
