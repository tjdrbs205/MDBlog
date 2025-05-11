import multer from "multer";
import { Readable } from "stream";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지만 업로드 할 수 있습니다.") as any, false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5mb
});

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readable;
}

export { upload, bufferToStream };
