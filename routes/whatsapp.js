const express = require("express");
const router = express.Router();
const db = require("../models");
const twilio = require("twilio");
const cron = require("node-cron");
const slack = require("axios").create({
  // baseURL: "https://graph.facebook.com/v19.0/354463551082624",
  // baseURL: "https://graph.facebook.com/v19.0/176451042228268",
  baseURL: "https://hooks.slack.com/services",
});

const SLACK_URL =
  "https://hooks.slack.com/services/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";

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
 * /whatsapp/daily-conversation:
 *   post:
 *     summary: 일일 대화 메시지 발송
 *     description: 등록된 사용자의 전화번호로 일일 대화 관련 WhatsApp 메시지를 발송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendDailyConversationMessage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자의 고유 식별자
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
 *                   example: "메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       404:
 *         description: 요청한 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/daily-conversation", async (req, res) => {
  try {
    const result = await sendDailyMessage("daily_conversation");
    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ message: "요청한 사용자를 찾을 수 없습니다." });
    } else {
      res
        .status(500)
        .json({ message: "서버 오류로 인해 메시지를 발송할 수 없습니다." });
    }
  }
});

/**
 * @swagger
 * /whatsapp/kpop_lyrics:
 *   post:
 *     summary: 일일 대화 메시지 발송
 *     description: 등록된 사용자의 전화번호로 일일 대화 관련 WhatsApp 메시지를 발송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendDailyConversationMessage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자의 고유 식별자
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
 *                   example: "메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       404:
 *         description: 요청한 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/kpop_lyrics", async (req, res) => {
  try {
    const result = await sendDailyMessage("kpop_lyrics");
    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ message: "요청한 사용자를 찾을 수 없습니다." });
    } else {
      res
        .status(500)
        .json({ message: "서버 오류로 인해 메시지를 발송할 수 없습니다." });
    }
  }
});

/**
 * @swagger
 * /whatsapp/topik_word:
 *   post:
 *     summary: 일일 대화 메시지 발송
 *     description: 등록된 사용자의 전화번호로 일일 대화 관련 WhatsApp 메시지를 발송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendDailyConversationMessage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자의 고유 식별자
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
 *                   example: "메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       404:
 *         description: 요청한 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/topik_word", async (req, res) => {
  try {
    const result = await sendDailyMessage("topik_word");
    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ message: "요청한 사용자를 찾을 수 없습니다." });
    } else {
      res
        .status(500)
        .json({ message: "서버 오류로 인해 메시지를 발송할 수 없습니다." });
    }
  }
});

/**
 * @swagger
 * /whatsapp/topik_variation:
 *   post:
 *     summary: 일일 대화 메시지 발송
 *     description: 등록된 사용자의 전화번호로 일일 대화 관련 WhatsApp 메시지를 발송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendDailyConversationMessage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자의 고유 식별자
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
 *                   example: "메시지가 성공적으로 발송되었습니다."
 *                 response:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "sent"
 *       404:
 *         description: 요청한 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/topik_variation", async (req, res) => {
  try {
    const result = await sendDailyMessage("topik_variation");
    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      response: result,
    });
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ message: "요청한 사용자를 찾을 수 없습니다." });
    } else {
      res
        .status(500)
        .json({ message: "서버 오류로 인해 메시지를 발송할 수 없습니다." });
    }
  }
});

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
  sendWelcomeMessage();
  return res.json({ message: "WhatsApp 메시지가 성공적으로 발송되었습니다." });

  const messages = [
    "MMb6846cfd2c181db2f3407e1431a9a469",
    "MM1de4f433370f8292c19a34b82d2cf721",
    "MM1b4ee12849cdf7fe39ac45302d270ed5",
    "MM9aeb0bb74b734b4df19d841e37e3f85d",
    "MM43f07df479c5a2804a776450907b3d2a",
    // 5
    "MM5105cb4a7c82d93806f6028036489c4c",
    "MMfb2daa6bb3296b3d417b7d7763f7575b",
    "MMfa8ad297ce8752ef7daade9dfd27947a",
    "MM48a51b0a86e74c59610c21c0c819420b",
    "MM9a35fdf40a4dc92940eb1fff823ad1a0",
    // 10
    "MMf955a20ecf6b0036ae4a50d4acfee29d",
    "MM0d30bb1d5c30ee61f08c54d54d9dee90",
    "MM79989d13cf665114d880a5d85e8a11bf",
    "MMcf0858a035f1110dfdd1a7c6b9bbabef",
    "MM6f1705d70ca1c94bd2c9aa677752d724",

    "MM45d2f50dea6cb75f7fce3a9655007f44",
    "MM88faf830517ea1f685dc04a230f995db",
  ];

  messages.forEach(async (message) => {
    await client.messages(message).update({ status: "canceled" });
  });
  // const users = [
  //   // "+821020252266",
  //   "+6287784039186",
  //   "+6282196021955",
  //   "+6281350486256",
  //   "+6282124287932",
  //   "+628895668019",
  //   "+628114533384",
  //   "+6285704604552",
  //   "+6283114217689",
  //   "+628567002423",
  //   "+821033308957",
  //   "+821045709002",
  // ];

  // const sendTodayEmptyMessage = async (to) => {
  //   await client.messages.create(
  //     {
  //       from: process.env.FROM_PHONE_NUMBER,
  //       to,
  //       contentSid: process.env.TEMPLATE_TOPIK_VARIATION,
  //       messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
  //       contentVariables: JSON.stringify({
  //         1: "다음을 순서에 맞게 배열한 것을 고르십시오.", // 질문
  //         2: "(가) 과일이 싸고 좋아서 많이 샀습니다. (나) 지난 주말에 장을 보러 마트에 갔습니다. (다) 저렴하게 구입한데다 사은품까지 받아 기분이 좋았습니다. (라) 마트 행사 중이라 사은품도 받았습니다.", // 보기
  //         3: "① (가) - (나) - (라) - (다)", // 정답
  //         4: "② (나) - (가) - (라) - (다)", // 정답
  //         5: "③ (가) - (다) - (나) - (라)", // 정답
  //         6: "④ (나) - (다) - (라) - (가)", // 정답
  //         7: "② (나) - (가) - (라) - (다)", // 정답
  //         8: "Jawaban yang benar adalah ② (나) - (가) - (라) - (다). Urutan ini secara akurat mencerminkan urutan temporal peristiwa yang dijelaskan dalam kalimat. Pilihan lain tidak cocok karena salah mencerminkan urutan kronologis kejadian. ① (가) - (나) - (라) - (다): Urutan ini menyiratkan bahwa pembicara membeli buah terlebih dahulu dan kemudian pergi ke supermarket, yang tidak sesuai dengan konteksnya. ③ (가) - (다) - (나) - (라): Urutan ini menyiratkan bahwa pembicara pergi ke supermarket setelah menerima hadiah gratis, namun ini tidak sesuai dengan konteksnya. ④ (나) - (다) - (라) - (가): Urutan ini menyiratkan bahwa pembicara menerima hadiah gratis sebelum membeli buah tersebut, yang tidak sesuai dengan konteksnya.", // 해설
  //       }),
  //       // contentVariables: JSON.stringify({
  //       //   1: "힘내다", // korean
  //       //   2: "himnaeda", // korean
  //       //   3: "Bersemangat", // pronunciation
  //       //   4: "시험 잘 보세요. 힘내세요!", // description
  //       //   5: "siheom jal boseyo. himnaeseyo!", // example_1
  //       //   6: "Semoga sukses ujianmu. Semangat!", // example_2
  //       // }),
  //       // scheduleType: "fixed",
  //       // sendAt: new Date(Date.UTC(2024, 6, 1, 2, 0, 0, 0)).toISOString(), // UTC 기준으로 한국 시간 오전 11시로 설정
  //     },
  //     (error) => {
  //       console.log(error);
  //     }
  //   );
  // };

  // users.forEach(async (user) => {
  //   sendTodayEmptyMessage(`whatsapp:${user}`);
  // });
  return;

  // const response = await client.messages.create(
  //   {
  //     from: process.env.FROM_PHONE_NUMBER,
  //     to: "whatsapp:+6281319705099",
  //     contentSid: process.env.TEMPLATE_DAILY_CONVERSATION,
  //     messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
  //     contentVariables: JSON.stringify({
  //       1: "답답하다", // korean
  //       2: "dapdapada", // pronunciation
  //       3: "Perasaan tertekan, jengkel, frustasi", // description
  //       4: "이 상황이 정말 답답해요.", // example_1
  //       5: "i sanghwangi jeongmal dapdapaeyo", // example_2 (예문 발음기호)
  //       6: "Situasi ini sangat membuat frustrasi", // example_3 (에문 설명)
  //     }),
  //     // scheduleType: "fixed",
  //     // sendAt: new Date(Date.UTC(2024, 6, 1, 2, 0, 0, 0)).toISOString(), // UTC 기준으로 한국 시간 오전 11시로 설정
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );
  // const response2 = await client.messages.create(
  //   {
  //     from: process.env.FROM_PHONE_NUMBER,
  //     to: "whatsapp:+6281324602755",
  //     contentSid: process.env.TEMPLATE_WELCOME,
  //     messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
  //     // scheduleType: "fixed",
  //     // sendAt: new Date(Date.UTC(2024, 6, 1, 2, 0, 0, 0)).toISOString(), // UTC 기준으로 한국 시간 오전 11시로 설정
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );
  // return;
  //   {
  //     from: process.env.FROM_PHONE_NUMBER,
  //     to: "whatsapp:+821020252266",
  //     contentSid: process.env.TEMPLATE_TOPIK_VARIATION_TEXT,
  //     messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
  //     // scheduleType: "fixed",
  //     // sendAt: new Date(new Date().setHours(7, 20, 0, 0)).toISOString(),
  //     contentVariables: JSON.stringify({
  //       1: "다음 밑줄 친 부분과 의미가 비슷한 것을 고르십시오", // 질문
  //       2: "태어난 지 얼마 안 되어 서울로 왔으니 서울이 고향인 셈이다.", // 보기
  //       3: "① 고향일 뿐이다", // 정답
  //       4: "② 고향이면 좋겠다", // 정답
  //       5: "③ 고향일 리가 없다", // 정답
  //       6: "④ 고향이나 마찬가지이다", // 정답
  //       7: "④ 고향이나 마찬가지이다", // 정답
  //       8: "Jawaban yang benar adalah ④ 고향이나 마찬가지이다 (Sama dengan kampung halamanku) Dalam konteksnya, ungkapan ini berarti bahwa meskipun “Seoul” bukan tempat kelahiran pembicara, namun ia sudah lama tinggal di sana dan menganggapnya sebagai kampung halamannya.", // 해설
  //     }),
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );
});

// 구독기간이 현재 진행 중인 사용자 목록을 가져오는 함수
async function fetchActiveSubscriptions(category) {
  const now = new Date();

  // 한국 시간은 UTC+9, 현재 한국 시간 계산
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(now.getTime() + koreaOffset);

  // 한국 시간 기준 현재 날짜
  let year = koreaNow.getFullYear();
  let month = koreaNow.getMonth();
  let date = koreaNow.getDate();

  const todayStart = new Date(Date.UTC(year, month, date - 1, 15, 0, 0, 0)); // 한국 시간으로 설정
  const todayEnd = new Date(Date.UTC(year, month, date, 14, 59, 59, 999)); // 한국 시간으로 설정

  console.log(todayStart, todayEnd);

  return await db.Subscription.findAll({
    where: {
      subscriptionDate: {
        [db.Sequelize.Op.lte]: todayEnd,
      },
      expirationDate: {
        [db.Sequelize.Op.gte]: todayStart,
      },
      type: category,
    },
    include: [
      {
        model: db.User,
        attributes: ["id", "name", "phoneNumber"],
      },
    ],
  });
}

const sendDailyMessage = async (category) => {
  let count = 0;
  const categorizedSubscriptions = {};

  // 구독기간이 현재 진행 중인 사용자 목록을 카테고리별로 분류
  const activeSubscriptions = await fetchActiveSubscriptions(category);
  activeSubscriptions.forEach((subscription) => {
    const category = subscription.type || "daily_conversation";
    if (!categorizedSubscriptions[category]) {
      categorizedSubscriptions[category] = [];
    }
    categorizedSubscriptions[category].push(subscription);
  });

  // 카테고리별로 함수 실행
  Object.keys(categorizedSubscriptions).forEach(async (category) => {
    const subscriptions = categorizedSubscriptions[category];
    sendSlack(`카테고리: ${category}, 구독자 수: ${subscriptions.length}`);
    console.log(`카테고리: ${category}, 구독자 수: ${subscriptions.length}`);
    // 여기에 카테고리별로 실행할 함수를 호출할 수 있습니다.
    await subscriptions.forEach(async (subscription, index) => {
      setTimeout(async () => {
        count += await processCategorySubscriptions(category, [subscription]);
      }, index * 500); // 0.5초 간격으로 호출
    });
  });

  return count;
};

const processCategorySubscriptions = async (category, subscriptions) => {
  if (category === "daily_conversation") {
    subscriptions.forEach(async (subscription) => {
      console.log("subscription.lastWordId", subscription.lastWordId);
      const todayWord = await db.Word.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId || 0,
          },
          type: {
            [db.Sequelize.Op.eq]: "daily_conversation",
          },
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      if (!todayWord) {
        sendSlack(`오늘의 단어가 없습니다.`);
        return;
      }

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_DAILY_CONVERSATION,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3: todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6: todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log("Scheduled message sent to", subscription.User.name);

        // 메시지 전송 후 lastWordId 업데이트
        await subscription.update({ lastWordId: todayWord.id });

        // ReceivedWords에 기록 추가
        await db.ReceivedWords.create({
          userId: subscription.userId,
          wordId: todayWord.id,
          receivedDate: new Date(),
        });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  } else if (category === "kpop_lyrics") {
    subscriptions.forEach(async (subscription) => {
      const todayWord = await db.Word.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId || 0,
          },
          type: {
            [db.Sequelize.Op.eq]: "kpop_lyrics",
          },
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      if (!todayWord) {
        sendSlack(`오늘의 단어가 없습니다.`);
        return;
      }

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_KPOP_LYRICS,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3: todayWord.description?.trim(), // description
            4: todayWord.source?.trim(), // 출처
            5: todayWord.example_1?.trim(), // example_1 (예문)
            6: todayWord.example_2?.trim(), // example_2 (에문 발음기호)
            7: todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayWord.id });

        // ReceivedWords에 기록 추가
        await db.ReceivedWords.create({
          userId: subscription.userId,
          wordId: todayWord.id,
          receivedDate: new Date(),
        });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  } else if (category === "topik_word") {
    subscriptions.forEach(async (subscription) => {
      const todayWord = await db.Word.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId || 0,
          },
          type: {
            [db.Sequelize.Op.eq]: "topik_word",
          },
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      if (!todayWord) {
        sendSlack(`오늘의 단어가 없습니다.`);
        return;
      }

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_TOPIK_WORD,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3: todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6: todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayWord.id });

        // ReceivedWords에 기록 추가
        await db.ReceivedWords.create({
          userId: subscription.userId,
          wordId: todayWord.id,
          receivedDate: new Date(),
        });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  } else if (category === "basic") {
    subscriptions.forEach(async (subscription) => {
      const todayWord = await db.Word.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId || 0,
          },
          type: {
            [db.Sequelize.Op.eq]: "basic",
          },
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      if (!todayWord) {
        sendSlack(`오늘의 단어가 없습니다.`);
        return;
      }

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_DAILY_CONVERSATION,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3: todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6: todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayWord.id });

        // ReceivedWords에 기록 추가
        await db.ReceivedWords.create({
          userId: subscription.userId,
          wordId: todayWord.id,
          receivedDate: new Date(),
        });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  } else if (category === "topik_variation") {
    subscriptions.forEach(async (subscription) => {
      const todayQuestion = await db.Question.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId || 0,
          },
          type: {
            [db.Sequelize.Op.eq]: "topik_variation",
          },
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      if (!todayQuestion) {
        sendSlack(`오늘의 문제가 없습니다.`);
        return;
      }

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      const hasImage = todayQuestion.imageUrl ? true : false;

      const contentVariables = hasImage
        ? JSON.stringify({
            1: todayQuestion.imageUrl?.trim(), // 이미지
            2: todayQuestion.title?.trim(), // 질문
            3: todayQuestion.example_1?.trim(), // 정답
            4: todayQuestion.example_2?.trim(), // 해설
            5: todayQuestion.example_3?.trim(), // 해설
            6: todayQuestion.example_4?.trim(), // 해설
            7: todayQuestion.answer?.trim(), // 해설
            8: todayQuestion.exaplanation?.trim(), // 해설
          })
        : JSON.stringify({
            1: todayQuestion.title?.trim(), // 질문
            2: todayQuestion.description?.trim(), // 보기
            3: todayQuestion.example_1?.trim(), // 정답
            4: todayQuestion.example_2?.trim(), // 해설
            5: todayQuestion.example_3?.trim(), // 해설
            6: todayQuestion.example_4?.trim(), // 해설
            7: todayQuestion.amnswer?.trim(), // 해설
            8: todayQuestion.exaplanation?.trim(), // 해설
          });

      const contentSid = hasImage
        ? process.env.TEMPLATE_TOPIK_VARIATION_MEDIA
        : process.env.TEMPLATE_TOPIK_VARIATION_TEXT;

      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
          contentVariables,
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayQuestion.id });

        // ReceivedWords에 기록 추가
        await db.ReceivedQuestions.create({
          userId: subscription.userId,
          questionId: todayQuestion.id,
          receivedDate: new Date(),
        });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  }

  const result = subscriptions.map((subscription) => subscription.userId);
  // uniqueId 개수
  const uniqueResult = [...new Set(result)];
  return uniqueResult.length;
};

async function fetchSubscriptionsStartingToday() {
  const todayStart = new Date();
  todayStart.setFullYear(2024, 6, 2); // 7월 1일로 설정 (월은 0부터 시작하므로 6은 7월을 의미)
  todayStart.setHours(0, 0, 0, 0); // 오늘의 시작 시간 설정
  const todayEnd = new Date();
  todayEnd.setFullYear(2024, 6, 2); // 7월 1일로 설정
  todayEnd.setHours(23, 59, 59, 999); // 오늘의 종료 시간 설정

  console.log(todayStart, todayEnd);
  try {
    const response = await db.Subscription.findAll({
      where: {
        subscriptionDate: {
          [db.Sequelize.Op.gte]: todayStart,
          [db.Sequelize.Op.lte]: todayEnd,
        },
        deletedAt: { [db.Sequelize.Op.is]: null },
      },
      include: [
        {
          model: db.User,
          attributes: ["id", "name", "phoneNumber"],
        },
      ],
    });
    console.log(response.length);
    return response;
  } catch (error) {
    console.error("Error fetching subscriptions: ", error);
    return [];
  }
}

// Twilio를 사용하여 환영 메시지를 보내는 함수
async function sendWelcomeMessage() {
  const activeSubscriptions = await fetchSubscriptionsStartingToday();
  if (activeSubscriptions.length === 0) {
    sendSlack("오늘 구독 시작하는 사용자가 없습니다.");
    console.log("오늘 구독 시작하는 사용자가 없습니다.");
    return;
  } else {
    console.log(
      `오늘 구독 시작하는 사용자가 ${activeSubscriptions.length}명(구독 기준) 있습니다. `
    );
    sendSlack(
      `오늘 구독 시작하는 사용자가 ${activeSubscriptions.length}명(구독 기준) 있습니다. `
    );
  }

  activeSubscriptions.forEach(async (subscription) => {
    const to = `whatsapp:${subscription.User.phoneNumber}`;
    try {
      const response = await client.messages.create(
        {
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_WELCOME,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: getSendAt(),
        },
        (error) => {
          console.log(error);
        }
      );

      console.log(" -> ", response);
    } catch (error) {
      console.error(
        `Error sending welcome message to ${subscription.User.name}: `,
        error
      );
    }
  });
}

const sendWeeklyQuiz = async (platform) => {
  const now = new Date();
  // 한국 시간은 UTC+9, 현재 한국 시간 계산
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(now.getTime() + koreaOffset);

  // 한국 시간 기준 현재 날짜
  let year = koreaNow.getFullYear();
  let month = koreaNow.getMonth();
  let date = koreaNow.getDate();

  const todayStart = new Date(Date.UTC(year, month, date - 1, 15, 0, 0, 0)); // 한국 시간으로 설정
  const todayEnd = new Date(Date.UTC(year, month, date, 14, 59, 59, 999)); // 한국 시간으로 설정

  console.log(todayStart, todayEnd);

  // 한국 시간 기준 해당 날짜의 오전 11시 1분을 UTC로 변환
  const sendAt = new Date(
    Date.UTC(year, month, date, 2, 1, 0, 0)
  ).toISOString();

  try {
    const activeSubscriptions = await db.Subscription.findAll({
      where: {
        subscriptionDate: {
          [db.Sequelize.Op.lte]: todayEnd,
        },
        expirationDate: {
          [db.Sequelize.Op.gte]: todayStart,
        },
        quiz: {
          [Op.ne]: null,
        },
        plan: {
          [Op.or]: [
            { [Op.like]: `${platform}_1` },
            { [Op.like]: `${platform}_3` },
            { [Op.like]: `${platform}_6` },
            { [Op.like]: `${platform}_12` },
          ],
        },
      },
      include: [
        {
          model: db.User,
          required: true,
        },
      ],
    });

    for (const subscription of activeSubscriptions) {
      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const words = await db.Word.findAll({
          where: {
            id: {
              [Op.lte]: subscription.lastWordId,
            },
            type: subscription.type,
          },
          limit: 7,
          order: [["id", "DESC"]],
        });

        const contentVariables = {};
        words.forEach((word, index) => {
          contentVariables[index + 1] = word.korean.trim();
        });

        for (let i = words.length; i < 7; i++) {
          contentVariables[i + 1] = "kosong"; // 인도네시아어로 '비어있음'
        }

        const response = await client.messages.create(
          {
            from: process.env.FROM_PHONE_NUMBER,
            to,
            contentSid: process.env.TEMPLATE_QUIZ,
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            scheduleType: platform === "whatsapp" ? "fixed" : undefined,
            sendAt: platform === "whatsapp" ? sendAt : undefined,
            contentVariables: JSON.stringify(contentVariables),
          },
          (error) => {
            console.log(error);
          }
        );

        console.log(" -> ", response);
      } catch (error) {
        sendSlack(
          `주간 퀴즈 메시지 발송 중 오류 발생: ${subscription.User.name}`
        );
        console.error(
          `Error sending quiz message to ${subscription.User.name}: `,
          error
        );
      }
    }
  } catch (error) {
    sendSlack(`주간 퀴즈 메시지 발송 중 오류 발생: ${error.message}`);
    console.error("Error fetching subscriptions: ", error);
  }
};

const sendSlack = async (message) => {
  let text = `${
    process.env.NODE_ENV === "development" ? "[테스트 환경]" : ""
  }${message}`;
  const response = await slack.post(
    "/T0684TBHDKQ/B07AEG61MR8/HnFpkqFfqpXIBgeTzTklvKJQ",
    {
      text,
    }
  );
};

const getSendAt = () => {
  // 현재 UTC 시간
  const now = new Date();

  // 한국 시간은 UTC+9, 현재 한국 시간 계산
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(now.getTime() + koreaOffset);

  // 한국 시간 기준 현재 날짜
  let year = koreaNow.getFullYear();
  let month = koreaNow.getMonth();
  let date = koreaNow.getDate();

  // 한국 시간 기준 해당 날짜의 오전 11시를 UTC로 변환
  let sendAt = new Date(Date.UTC(year, month, date, 2, 0, 0, 0));

  console.log(`Generated sendAt date: ${sendAt.toISOString()}`);
  return sendAt.toISOString();
};

// DB 깨우기 (serverless 때문에)
cron.schedule("0 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] DB 깨우기 시도");
    }
  } catch (e) {
    sendSlack("[준비] DB 깨우기 시도");
  }
});

// DB 깨우기 (serverless 때문에)
cron.schedule("2 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] DB 깨우기 성공");
    }
  } catch (e) {
    sendSlack("[준비] DB 깨우기 실패");
  }
});

cron.schedule("4 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("basic");

      sendSlack(`[일일 메시지] basic: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack("[일일 메시지] basic: 요청한 사용자를 찾을 수 없습니다.");
      } else {
        sendSlack(
          "[일일 메시지] basic: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] basic: 작업 중 오류 발생");
  }
});

// 매일 한국 시간 오전 0시 5분에 작동하는 cron 작업을 설정합니다.
// 한국 시간은 UTC+9이므로, UTC 시간으로는 오후 3시 5분입니다.
cron.schedule("5 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("kpop_lyrics");

      sendSlack(`[일일 메시지] kpop_lyrics: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] kpop_lyrics: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] kpop_lyrics: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] kpop_lyrics: 작업 중 오류 발생");
  }
});

cron.schedule("6 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_word");

      sendSlack(`[일일 메시지] topik_word: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] topik_word: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] topik_word: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] topik_word: 작업 중 오류 발생");
  }
});

cron.schedule("7 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_variation");

      sendSlack(`[일일 메시지] topik_variation: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] topik_variation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] topik_variation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] topik_variation: 작업 중 오류 발생");
  }
});

cron.schedule("8 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("daily_conversation");

      sendSlack(`[일일 메시지] daily_conversation: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] daily_conversation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] daily_conversation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] daily_conversation: 작업 중 오류 발생");
  }
});

cron.schedule("15 0 * * 0", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      await sendWeeklyQuiz("whatsapp");

      sendSlack(`[주간 퀴즈] Whatsapp 퀴즈 발송 예약 완료`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack("[주간 퀴즈] Whatsapp 요청한 사용자를 찾을 수 없습니다.");
      } else {
        sendSlack(
          "[주간 퀴즈] Whatsapp 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[주간 퀴즈] Whatsapp 작업 중 오류 발생");
  }
});

module.exports = router;
