const express = require("express");
const router = express.Router();
const db = require("../models");

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: 모든 질문 가져오기
 *     description: 페이지네이션을 사용하여 모든 질문을 가져옵니다.
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
 *         description: 질문 목록 반환
 *       500:
 *         description: 서버 오류
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Question.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    const total = Math.ceil(count / limit);
    const result = {
      totalPage: total,
      totalCount: count,
      questions: rows,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: 특정 질문 가져오기
 *     description: ID를 사용하여 특정 질문을 가져옵니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 질문 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 질문 반환
 *       404:
 *         description: 질문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", async (req, res) => {
  try {
    const question = await db.Question.findByPk(req.params.id);
    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ error: "question not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: 질문 생성
 *     description: 새로운 질문을 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - answer
 *               - explanation
 *               - example_1
 *               - example_2
 *               - example_3
 *               - type
 *               - level
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *                 description: 질문 제목
 *               description:
 *                 type: string
 *                 description: 질문 설명
 *               answer:
 *                 type: string
 *                 description: 질문의 답
 *               explanation:
 *                 type: string
 *                 description: 답 설명
 *               example_1:
 *                 type: string
 *                 description: 예문 1
 *               example_2:
 *                 type: string
 *                 description: 예문 2
 *               example_3:
 *                 type: string
 *                 description: 예문 3
 *               type:
 *                 type: string
 *                 description: 질문 유형
 *               level:
 *                 type: integer
 *                 description: 난이도 레벨
 *               imageUrl:
 *                 type: string
 *                 description: 이미지 URL
 *     responses:
 *       200:
 *         description: 생성된 질문 반환
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  try {
    const newQuestion = await db.Question.create({
      title: req.body.title,
      description: req.body.description,
      answer: req.body.answer,
      explanation: req.body.explanation,
      example_1: req.body.example_1,
      example_2: req.body.example_2,
      example_3: req.body.example_3,
      type: req.body.type,
      level: req.body.level,
      imageUrl: req.body.imageUrl,
    });
    res.json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: 질문 업데이트
 *     description: 특정 질문의 정보를 업데이트합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 질문 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: 업데이트할 질문
 *     responses:
 *       200:
 *         description: 업데이트된 질문 반환
 *       404:
 *         description: 질문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", async (req, res) => {
  try {
    const question = await db.Question.findByPk(req.params.id);
    if (question) {
      await question.update(req.body);
      res.json(question);
    } else {
      res.status(404).json({ error: "Question not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: 질문 삭제
 *     description: 특정 질문을 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 질문 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 질문 삭제 성공 메시지 반환
 *       404:
 *         description: 질문을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", async (req, res) => {
  try {
    const question = await db.Question.findByPk(req.params.id);
    if (question) {
      await question.destroy(); // soft delete를 위해 destroy 메소드 사용
      res.json({ message: "question soft deleted" });
    } else {
      res.status(404).json({ error: "question not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
