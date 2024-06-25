const express = require("express");
const router = express.Router();
const db = require("../models");
const axios = require("axios").create({
  baseURL: "https://graph.facebook.com/v19.0/110677915346811",
});

/**
 * @swagger
 * /whatsapp/send-message:
 *   post:
 *     summary: WhatsApp 메시지 발송
 *     description: 특정 전화번호로 WhatsApp 메시지를 발송합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *     responses:
 *       '200':
 *         description: WhatsApp 메시지 발송 성공
 *       '404':
 *         description: 사용자를 찾을 수 없음
 *       '500':
 *         description: 서버 오류
 */
router.post("/send-message", async (req, res) => {
  try {
    // const userId = req.body.userId;
    // const user = await db.User.findByPk(userId);

    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    const phoneNumber = "821020252266";
    // WhatsApp 메시지 발송 API 호출
    const response = await axios.post(
      "/messages",
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      },
      {
        headers: {
          Authorization:
            "Bearer EABw1aapKBTcBOzKB0WGiFzBnSSssOXZCrKFKqPchVWAbEkgcH6xBfZCaDypQgUxmBVKr4ZBWJfwVz8MZBeSeZArC3jITrbDkg65SFcKFwYWf4ZB8IWtMweEfmMckEdUiTWlKZCQBd7ZC2Q4NJwrBdoX0N0lxqyADc9eEJTHeBgBLr8T0tHF34CdBWlDQyc9VelfuKxkEJsnn44dGZCzKr3QZAoKOm2WxZCS",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    res.json({
      message: "WhatsApp 메시지가 성공적으로 발송되었습니다.",
      response: data,
    });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
