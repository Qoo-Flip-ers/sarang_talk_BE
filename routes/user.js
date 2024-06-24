const express = require("express");
const router = express.Router();
const db = require("../models");

// 사용자 조회
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.User.findAndCountAll({
      where: { deletedAt: null },
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
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 특정 사용자 가져오기
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
router.post("/", async (req, res) => {
  try {
    const newUser = await db.User.create(req.body);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 사용자 업데이트
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
