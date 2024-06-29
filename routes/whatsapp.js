const express = require("express");
const router = express.Router();
const db = require("../models");
const twilio = require("twilio");
const axios = require("axios").create({
  // baseURL: "https://graph.facebook.com/v19.0/354463551082624",
  baseURL: "https://graph.facebook.com/v19.0/176451042228268",
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendDailyConversation = async (phoneNumber) => {
  const data = await db.Word.findOne({
    where: { id: 1 },
  });

  if (!data) {
    throw new Error("Word not found");
  }

  const components = [
    {
      type: "header",
      parameters: [
        {
          type: "text",
          text: data.korean,
        },
      ],
    },
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: data.pronunciation,
        },
        {
          type: "text",
          text: data.description,
        },
        {
          type: "text",
          text: data.example_1,
        },
        {
          type: "text",
          text: data.example_2,
        },
        {
          type: "text",
          text: data.example_3,
        },
      ],
    },
  ];

  const response = await axios.post(
    "/messages",
    {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: process.env.TEMPLATE_WELCOME,
        language: {
          code: "id_ID",
        },
        components,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response;
};

/**
 * @swagger
 * /whatsapp/send-message:
 *   post:
 *     summary: WhatsApp 메시지 발송
 *     description: 특정 전화번호로 WhatsApp 메시지를 발송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendWhatsAppMessage
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
 *       200:
 *         description: WhatsApp 메시지 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "WhatsApp 메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post("/send-message", async (req, res) => {
  try {
    const activeUsers = await db.User.findAll({
      where: { status: "active" },
    });
    const result = [];

    for (const user of activeUsers) {
      const phoneNumber = user.phoneNumber; // 가정: User 모델에 phoneNumber 필드가 있다고 가정합니다.
      // WhatsApp 메시지 발송 API 호출
      const response = await sendDailyConversation(phoneNumber);
      result.push(response.data);
    }

    res.json({
      message: "WhatsApp 메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});
/**
 * @swagger
 * /whatsapp/welcome:
 *   post:
 *     summary: 활성 사용자에게 환영 메시지를 WhatsApp으로 발송
 *     description: 활성 상태인 모든 사용자에게 WhatsApp을 통해 환영 메시지를 보냅니다.
 *     tags:
 *       - WhatsApp
 *     responses:
 *       200:
 *         description: 메시지가 성공적으로 발송되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "WhatsApp 메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       500:
 *         description: 서버 오류
 */

router.post("/welcome", async (req, res) => {
  console.log(process.env.TEMPLATE_WELCOME);
  await client.messages.create(
    {
      from: process.env.FROM_PHONE_NUMBER,
      to: "whatsapp:+821033308957",
      contentSid: process.env.TEMPLATE_WELCOME,
      messagingServiceSid: "MGc11b68678a2fa216588c979110f444fe",
      // contentVariables: JSON.stringify({
      //   1: "Name",
      // }),
    },
    (error) => {
      console.log(error);
    }
  );
  await client.messages.create(
    {
      from: process.env.FROM_PHONE_NUMBER,
      to: "whatsapp:+821045709002",
      contentSid: process.env.TEMPLATE_WELCOME,
      messagingServiceSid: "MGc11b68678a2fa216588c979110f444fe",
      // contentVariables: JSON.stringify({
      //   1: "Name",
      // }),
    },
    (error) => {
      console.log(error);
    }
  );

  // client.messages
  //     .create({
  //        contentSid: 'HXXXXXXXXX',
  //        from: 'MGXXXXXXXX',
  //        contentVariables: JSON.stringify({
  //          1: 'Name'
  //        }),
  //        to: 'whatsapp:+18551234567'
  //      })
  //     .then(message => console.log(message.sid));
  return;
  console.log(process.env.TEMPLATE_WELCOME);
  try {
    const response = await axios.post(
      "/messages",
      {
        messaging_product: "whatsapp",
        to: "+821020252266",
        type: "template",
        template: {
          // name: "hello_world",
          name: "match_done_2",
          language: { code: "id_ID" },
        },
      },
      // {
      //   messaging_product: "whatsapp",
      //   to: "+821020252266",
      //   type: "template",
      //   recipient_type: "individual",
      //   template: {
      //     name: process.env.TEMPLATE_WELCOME,
      //     language: {
      //       code: "id_ID",
      //     },
      //   },
      // },
      {
        headers: {
          // Authorization: `Bearer EAADpaovzgNUBOZCpJm8ZAWgZAeKVwvFN8UJNbNt4WBtbW5spJkISvW2f97cHhC7ZB3W6mHgs5TkNpWDZARwUgwEKq969doiV6iaKbsYUTwf856aj9DTGqfcWPOsi40EpGdHotdDSqGndsNZBcU0QitsK0NDU0KlaIloTHCpC2Kc1RXhNbw0ZBxhvdY4VFZCZAZAhTzcZBfZBuX6ekkXsjXPJ3UTyZAZCxJrBll`,
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);
    return res.json(response.data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
  try {
    // const activeUsers = await db.User.findAll({
    //   where: { status: "active" },
    // });

    const result = [];
    for (const user of activeUsers) {
      const phoneNumber = user.phoneNumber; // 가정: User 모델에 phoneNumber 필드가 있다고 가정합니다.
      // WhatsApp 메시지 발송 API 호출
      const response = await axios.post(
        "/messages",
        {
          messaging_product: "whatsapp",
          to: "+821020252266",
          type: "template",
          template: {
            name: process.env.TEMPLATE_WELCOME,
            language: {
              code: "id_ID",
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      result.push(response.data);
    }

    res.json({
      message: "WhatsApp 메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
