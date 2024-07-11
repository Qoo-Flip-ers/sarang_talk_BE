const express = require("express");
const router = express.Router();
const db = require("../models");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ token: process.env.AUTH_TOKEN });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken === process.env.AUTH_TOKEN) {
    return res.status(200).json({ token: process.env.AUTH_TOKEN });
  }

  return res.status(400).json({ error: "Invalid credentials" });
});

module.exports = router;
