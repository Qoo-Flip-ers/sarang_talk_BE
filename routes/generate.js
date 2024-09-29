const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
require("dotenv").config();
const { Readable } = require("stream");

// OpenAI API 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @swagger
 * /generate/word:
 *   post:
 *     summary: 한국어 표현을 기반으로 다국어 정보 생성
 *     description: 주어진 한국어 표현을 기반으로 발음, 번역, 예문 등의 정보를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expression
 *             properties:
 *               expression:
 *                 type: string
 *                 description: 한국어 표현
 *     responses:
 *       200:
 *         description: 성공적으로 생성된 정보
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/word", async (req, res) => {
  const { expression } = req.body;

  if (!expression) {
    return res.status(400).json({ error: "Expression is required" });
  }

  const prompt = `
주어진 한국어 표현을 기반으로 다음 필드를 자동으로 생성해줘:

1. 한국어 표현 발음기호 (로마자 표기)
2. 인도네시아어로 표현 번역
3. 영어로 표현 번역
4. 한국어 예문
5. 예문 발음기호 (로마자 표기)
6. 인도네시아어로 예문 번역
7. 영어로 예문 번역

입력된 표현: "${expression}"

결과는 아래와 같은 JSON 형식으로 반환해줘:
{
  "expression_kr": "${expression}",
  "pronunciation": "{발음기호}",
  "meaning_id": "{인도네시아어 번역}",
  "meaning_en": "{영어 번역}",
  "example_sentence_kr": "{예문}",
  "example_pronunciation": "{예문 발음기호}",
  "example_meaning_id": "{인도네시아어 예문 번역}",
  "example_meaning_en": "{영어 예문 번역}"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.56,
      top_p: 1,
    });

    try {
      const generatedData = response.choices[0].message.content;
      const formattedData = JSON.parse(generatedData);

      console.log(formattedData);
      res.json(formattedData);
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      res.status(500).json({ error: "응답 파싱 실패" });
    }
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

/**
 * @swagger
 * /generate/pronunciation:
 *   get:
 *     summary: 단어의 발음 오디오 URL을 가져옵니다
 *     tags: [Generate]
 *     parameters:
 *       - in: query
 *         name: word
 *         required: true
 *         schema:
 *           type: string
 *         description: 발음을 가져올 한국어 단어
 *     responses:
 *       200:
 *         description: 성공적으로 발음 오디오 URL을 가져왔습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audioUrl:
 *                   type: string
 *                   description: 발음 오디오 파일의 URL
 *       400:
 *         description: 잘못된 요청 (단어가 제공되지 않음)
 *       404:
 *         description: 발음 파일을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// Start of Selection
router.get("/pronunciation", async (req, res) => {
  try {
    console.log("발음 요청 시작");
    const { word } = req.query;

    if (!word) {
      console.log("단어가 제공되지 않음");
      return res.status(400).json({ error: "단어가 제공되지 않았습니다." });
    }

    console.log(`요청된 단어: ${word}`);
    const url = `https://ko.dict.naver.com/#/search?query=${encodeURIComponent(
      word
    )}`;
    console.log(`네이버 사전 URL: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("브라우저 실행됨");

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    console.log("새 페이지 생성 및 User-Agent 설정");

    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    console.log("페이지 로드 완료");

    try {
      await page.waitForSelector("button._listen_global_item.btn_listen.all", {
        timeout: 10000,
      });
      console.log("전체 발음 듣기 버튼 발견");
      await page.click("button._listen_global_item.btn_listen.all");
      console.log("전체 발음 듣기 버튼 클릭");
    } catch (error) {
      console.error("전체 발음 듣기 버튼 클릭 실패:", error);
    }

    try {
      await page.waitForSelector(".btn_listen_global.mp3._btn_play_single", {
        timeout: 10000,
      });
      console.log("개별 발음 듣기 버튼 발견");
    } catch (error) {
      console.error("개별 발음 듣기 버튼을 찾지 못함:", error);
    }

    const audioUrl = await page.evaluate(() => {
      const audioElement = document.querySelector(
        ".btn_listen_global.mp3._btn_play_single"
      );
      return audioElement ? audioElement.getAttribute("data-playobj") : null;
    });
    console.log(`발견된 오디오 URL: ${audioUrl}`);

    await browser.close();
    console.log("브라우저 종료");

    if (!audioUrl) {
      console.log("발음 파일을 찾을 수 없음");
      return res.status(404).json({ error: "발음 파일을 찾을 수 없습니다." });
    }

    if (!audioUrl.startsWith("https://dict-dn.pstatic.net")) {
      console.log("유효하지 않은 오디오 URL");
      return res.status(400).json({ error: "유효하지 않은 오디오 URL입니다." });
    }

    console.log("오디오 파일 다운로드 시작");
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(response.data);
    console.log("오디오 파일 다운로드 완료");

    const tempOggPath = path.join(__dirname, `${uuidv4()}.ogg`);
    console.log(`임시 Ogg 파일 경로: ${tempOggPath}`);

    console.log("Ogg 파일로 변환 시작");

    const inputStream = new Readable();
    inputStream.push(audioBuffer);
    inputStream.push(null);

    await new Promise((resolve, reject) => {
      ffmpeg(inputStream)
        .inputFormat("mp3")
        .audioCodec("libvorbis")
        .toFormat("ogg")
        .on("end", () => {
          console.log("Ogg 파일 변환 완료");
          resolve();
        })
        .on("error", (err) => {
          console.error("Ogg 파일 변환 실패:", err);
          reject(err);
        })
        .save(tempOggPath);
    });

    console.log("Azure Blob Storage 업로드 시작");
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}.ogg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(tempOggPath);
    console.log("Azure Blob Storage 업로드 완료");

    console.log("임시 파일 삭제");
    await fs.promises.unlink(tempOggPath);

    const uploadedUrl = blockBlobClient.url;
    console.log(`업로드된 URL: ${uploadedUrl}`);
    res.json({ audioUrl: uploadedUrl });
  } catch (error) {
    console.error("발음 데이터 가져오기 오류:", error);
    res.status(500).json({ error: "발음 데이터를 가져오는 데 실패했습니다." });
  }
});

const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "word-speech";

router.post("/speech", async (req, res) => {
  try {
    const { word } = req.body;
    // 입력 유효성 검사
    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "유효하지 않은 입력입니다." });
    }

    // OpenAI TTS API를 사용하여 음성 생성 (opus 형식으로)
    const opus = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: word,
      speed: 0.9,
      response_format: "opus",
    });

    // 음성 데이터를 버퍼로 변환
    const opusBuffer = Buffer.from(await opus.arrayBuffer());

    // 임시 파일 경로 생성
    const tempOpusPath = path.join(__dirname, `${uuidv4()}.opus`);
    const tempOggPath = path.join(__dirname, `${uuidv4()}.ogg`);

    // 임시 Opus 파일 저장
    await fs.promises.writeFile(tempOpusPath, opusBuffer);

    // Opus를 Ogg로 변환
    await new Promise((resolve, reject) => {
      ffmpeg(tempOpusPath)
        .outputOptions("-c:a libopus")
        .toFormat("ogg")
        .on("end", resolve)
        .on("error", reject)
        .save(tempOggPath);
    });

    // Azure Blob Storage에 업로드
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}.ogg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(tempOggPath);

    // 임시 파일들 삭제
    await Promise.all([
      fs.promises.unlink(tempOpusPath),
      fs.promises.unlink(tempOggPath),
    ]);

    // 업로드된 파일의 URL 반환
    const url = blockBlobClient.url;
    res.json({ url });
  } catch (error) {
    console.error("음성 생성 오류:", error);
    res.status(500).json({ error: "음성 생성 중 오류가 발생했습니다." });
  }
});

router.post("/combine-gif-audio", async (req, res) => {
  try {
    const { gifUrl, audioUrl } = req.body;

    // 입력 유효성 검사
    if (!gifUrl || !audioUrl) {
      return res
        .status(400)
        .json({ error: "GIF URL과 오디오 URL이 필요합니다." });
    }

    // 임시 파일 경로 생성
    const tempGifPath = path.join(__dirname, `${uuidv4()}.gif`);
    const tempAudioPath = path.join(__dirname, `${uuidv4()}.ogg`);
    const tempOutputPath = path.join(__dirname, `${uuidv4()}.mp4`);

    // GIF와 오디오 파일 다운로드
    const [gifResponse, audioResponse] = await Promise.all([
      axios.get(gifUrl, { responseType: "arraybuffer" }),
      axios.get(audioUrl, { responseType: "arraybuffer" }),
    ]);

    // 임시 파일로 저장
    await Promise.all([
      fs.promises.writeFile(tempGifPath, Buffer.from(gifResponse.data)),
      fs.promises.writeFile(tempAudioPath, Buffer.from(audioResponse.data)),
    ]);

    // GIF와 오디오 길이 확인
    const [gifDuration, audioDuration] = await Promise.all([
      getGifDuration(tempGifPath),
      getAudioDuration(tempAudioPath),
    ]);

    // 더 긴 길이 계산
    const maxDuration = Math.max(gifDuration, audioDuration);

    // 오디오 시작 시간 계산 (전체 길이에서 오디오 길이를 뺀 시간)
    const audioStartTime = Math.max(0, maxDuration - audioDuration);

    // FFmpeg를 사용하여 GIF와 오디오 합성
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(tempGifPath)
        .inputOptions([
          `-stream_loop ${Math.ceil(maxDuration / gifDuration) - 1}`,
        ])
        .input(tempAudioPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-strict experimental",
          "-pix_fmt yuv420p",
          `-t ${maxDuration}`,
          "-filter_complex",
          `[1:a]adelay=${Math.floor(audioStartTime * 1000)}|${Math.floor(
            audioStartTime * 1000
          )}[delayedaudio];[0:v][delayedaudio]concat=n=1:v=1:a=1[v][a]`,
          "-map [v]",
          "-map [a]",
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(tempOutputPath);
    });

    // Azure Blob Storage에 업로드
    const containerClient = blobServiceClient.getContainerClient("video");
    const blobName = `${uuidv4()}.mp4`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(tempOutputPath);

    // 임시 파일들 삭제
    await Promise.all([
      fs.promises.unlink(tempGifPath),
      fs.promises.unlink(tempAudioPath),
      fs.promises.unlink(tempOutputPath),
    ]);

    // 업로드된 파일의 URL 반환
    const url = blockBlobClient.url;
    res.json({ url });
  } catch (error) {
    console.error("GIF와 오디오 합성 오류:", error);
    res
      .status(500)
      .json({ error: "GIF와 오디오 합성 중 오류가 발생했습니다." });
  }
});

// GIF 길이 확인 함수
async function getGifDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}

// 오디오 길이 확인 함수
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}

module.exports = router;
