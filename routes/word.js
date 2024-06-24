const express = require("express");
const router = express.Router();
const db = require("../models");

// 모든 단어 가져오기
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
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 특정 단어 가져오기
router.get("/:id", async (req, res) => {
  try {
    const word = await db.Word.findByPk(req.params.id);
    if (word) {
      res.json(word);
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 단어 생성
router.post("/", async (req, res) => {
  try {
    const newWord = await db.Word.create(req.body);
    res.json(newWord);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 단어 업데이트
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
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 단어 삭제
router.delete("/:id", async (req, res) => {
  try {
    const word = await db.Word.findByPk(req.params.id);
    if (word) {
      await word.update({ deletedAt: new Date() });
      res.json({ message: "Word soft deleted" });
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
