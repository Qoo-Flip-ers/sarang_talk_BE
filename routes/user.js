const express = require("express");
const router = express.Router();
const db = require("../models");

// 사용자 조회
/**
 * @swagger
 * /users:
 *   get:
 *     summary: 사용자 조회
 *     description: 사용자 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 성공적으로 조회된 사용자 정보
 *       500:
 *         description: 서버 오류
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.User.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    const total = Math.ceil(count / limit);
    const result = {
      totalPage: total,
      totalCount: count,
      users: rows,
    };

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 특정 사용자 가져오기
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: 특정 사용자 가져오기
 *     description: 특정 사용자의 정보를 가져옵니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 성공적으로 조회된 사용자 정보
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 사용자 생성
/**
 * @swagger
 * /users:
 *   post:
 *     summary: 사용자 생성
 *     description: 새로운 사용자를 생성합니다.
 *     responses:
 *       200:
 *         description: 성공적으로 생성된 사용자 정보
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  try {
    const newUser = await db.User.create(req.body);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 사용자 업데이트
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: 사용자 업데이트
 *     description: 특정 사용자의 정보를 업데이트합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 성공적으로 업데이트된 사용자 정보
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/:id", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      await user.update(req.body);
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 사용자 삭제
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 특정 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자가 성공적으로 삭제됨
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete("/:id", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (user) {
      await user.update({ deletedAt: new Date() });
      res.json({ message: "User soft deleted" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
