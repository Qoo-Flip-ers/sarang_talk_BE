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
    });

    console.log(response);
    const generatedData = JSON.parse(response.choices[0].message.content);
    res.json(generatedData);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

module.exports = router;
