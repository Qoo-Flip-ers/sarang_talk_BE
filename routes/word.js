const express = require("express");
const router = express.Router();
const db = require("../models");

/**
 * @swagger
 * /words:
 *   get:
 *     summary: 모든 단어 가져오기
 *     description: 페이지네이션을 사용하여 모든 단어를 가져옵니다.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지 당 항목 수
 *     responses:
 *       200:
 *         description: 단어 목록 반환
 *       500:
 *         description: 서버 오류
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Word.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    const total = Math.ceil(count / limit);
    const result = {
      totalPage: total,
      totalCount: count,
      words: rows,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /words/{id}:
 *   get:
 *     summary: 특정 단어 가져오기
 *     description: ID를 사용하여 특정 단어를 가져옵니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 단어 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 단어 반환
 *       404:
 *         description: 단어를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", async (req, res) => {
  try {
    const word = await db.Word.findByPk(req.params.id);
    if (word) {
      res.json(word);
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /words:
 *   post:
 *     summary: 단어 생성
 *     description: 새로운 단어를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - korean
 *               - description
 *               - pronunciation
 *               - example_1
 *               - example_2
 *               - example_3
 *               - level
 *               - type
 *             properties:
 *               korean:
 *                 type: string
 *                 description: 단어 (한국어)
 *               description:
 *                 type: string
 *                 description: 설명 (인도네시아어)
 *               pronunciation:
 *                 type: string
 *                 description: 발음 (인도네시아어)
 *               example_1:
 *                 type: string
 *                 description: 예문 1
 *               example_2:
 *                 type: string
 *                 description: 예문 2
 *               example_3:
 *                 type: string
 *                 description: 예문 3
 *               level:
 *                 type: integer
 *                 description: 난이도 레벨
 *               type:
 *                 type: string
 *                 description: 단어 유형
 *     responses:
 *       200:
 *         description: 생성된 단어 반환
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  try {
    const newWord = await db.Word.create({
      korean: req.body.korean,
      description: req.body.description,
      pronunciation: req.body.pronunciation,
      example_1: req.body.example_1,
      example_2: req.body.example_2,
      example_3: req.body.example_3,
      level: req.body.level,
      type: req.body.type,
    });
    res.json(newWord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /words/{id}:
 *   put:
 *     summary: 단어 업데이트
 *     description: 특정 단어의 정보를 업데이트합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 단어 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word:
 *                 type: string
 *                 description: 업데이트할 단어
 *     responses:
 *       200:
 *         description: 업데이트된 단어 반환
 *       404:
 *         description: 단어를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", async (req, res) => {
  try {
    const word = await db.Word.findByPk(req.params.id);
    if (word) {
      await word.update(req.body);
      res.json(word);
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /words/{id}:
 *   delete:
 *     summary: 단어 삭제
 *     description: 특정 단어를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 단어 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 단어 삭제 성공 메시지 반환
 *       404:
 *         description: 단어를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", async (req, res) => {
  try {
    const word = await db.Word.findByPk(req.params.id);
    if (word) {
      await word.destroy(); // soft delete를 위해 destroy 메소드 사용
      res.json({ message: "Word soft deleted" });
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
