// Start of Selection
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "images";

// 임시 디렉토리에 파일을 저장하는 multer 설정
const upload = multer({
  dest: "temp/",
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "image") {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
  limits: { files: 1, fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한을 10MB로 설정
});

// 단일 파일 업로드 API
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
    }

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}${path.extname(req.file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 파일을 스트림으로 읽어 Azure에 업로드
    const stream = fs.createReadStream(req.file.path);
    await blockBlobClient.uploadStream(stream);

    // 임시 파일 삭제
    await fs.promises.unlink(req.file.path);

    const url = blockBlobClient.url;
    res.json({ message: "파일이 성공적으로 업로드되었습니다.", url });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      // Multer 에러 처리
      console.error("파일 업로드 Multer 오류:", error);
      return res.status(400).json({ error: error.message });
    }
    console.error("파일 업로드 오류:", error);
    res.status(500).json({ error: "파일 업로드 중 오류가 발생했습니다." });
  }
});

module.exports = router;
