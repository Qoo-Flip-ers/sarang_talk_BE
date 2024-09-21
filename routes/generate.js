const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
require("dotenv").config();

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
router.get("/pronunciation", async (req, res) => {
  try {
    const { word } = req.query;

    if (!word) {
      return res.status(400).json({ error: "단어가 제공되지 않았습니다." });
    }

    const url = `https://ko.dict.naver.com/#/search?query=${encodeURIComponent(
      word
    )}`;
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    // 전체 발음 듣기 버튼을 기다리고 클릭합니다.
    await page.waitForSelector("button._listen_global_item.btn_listen.all", {
      timeout: 10000,
    });
    await page.click("button._listen_global_item.btn_listen.all");

    // 개별 발음 듣기 버튼이 나타날 때까지 기다립니다.
    await page.waitForSelector(".btn_listen_global.mp3._btn_play_single", {
      timeout: 10000,
    });

    const audioUrl = await page.evaluate(() => {
      const audioElement = document.querySelector(
        ".btn_listen_global.mp3._btn_play_single"
      );
      return audioElement ? audioElement.getAttribute("data-playobj") : null;
    });

    await browser.close();

    if (!audioUrl) {
      return res.status(404).json({ error: "발음 파일을 찾을 수 없습니다." });
    }

    if (!audioUrl.startsWith("https://dict-dn.pstatic.net")) {
      return res.status(400).json({ error: "유효하지 않은 오디오 URL입니다." });
    }

    res.json({ audioUrl });
  } catch (error) {
    console.error("발음 데이터 가져오기 오류:", error);
    res.status(500).json({ error: "발음 데이터를 가져오는 데 실패했습니다." });
  }
});

const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

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

    // OpenAI TTS API를 사용하여 음성 생성
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova",
      input: word,
      speed: 0.9,
      response_format: "ogg",
    });

    // 음성 데이터를 버퍼로 변환
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 음성이 잘 들리도록 볼륨 조정 (필요한 경우)
    // 참고: 이 부분은 외부 라이브러리가 필요할 수 있습니다.
    // const adjustedBuffer = await adjustVolume(buffer, 1.2);

    // Azure Blob Storage에 업로드
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}.mp3`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(buffer, buffer.length);

    // 업로드된 파일의 URL 반환
    const url = blockBlobClient.url;
    res.json({ url });
  } catch (error) {
    console.error("음성 생성 오류:", error);
    res.status(500).json({ error: "음성 생성 중 오류가 발생했습니다." });
  }
});

module.exports = router;
