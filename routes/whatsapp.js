const express = require("express");
const router = express.Router();
const db = require("../models");

router.post("/send-message", async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const phoneNumber = user.phoneNumber;

    // WhatsApp 메시지 발송 API 호출
    const response = await axios.post(
      "https://graph.facebook.com/v19.0/176451042228268/messages",
      {
        headers: {
          Authorization:
            "Bearer EABw1aapKBTcBO4HmhFlWUyXbWRHcY3NCRzTbnMGy4Fapb17dsddbPAyMvMAvoBKcGU0k2cuXmEvXmCXvvQP5u4fD4oHz0illcdJZCv3Aa9hlGTdOBqrn1LBfV5ZCU3OrgMVi0p9UPku3qBrl7hPZCcr2ZA5GTx5HGpu7ExsnHrll5oyWAP6mmkgEpVKdSD2iTbF0yat0IBYshIoG6OpwtBscHTYZD",
          "Content-Type": "application/json",
        },
        data: {
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
      }
    );

    const data = response.data;

    res.json({
      message: "WhatsApp 메시지가 성공적으로 발송되었습니다.",
      response: data,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
