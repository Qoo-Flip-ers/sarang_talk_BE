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
  // const response = await client.messages.create(
  //   {
  //     from: process.env.FROM_PHONE_NUMBER,
  //     to: "whatsapp:+821020252266",
  //     contentSid: process.env.TEMPLATE_TOPIK_VARIATION_TEXT,
  //     messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
  //     // scheduleType: "fixed",
  //     // sendAt: new Date(new Date().setHours(7, 20, 0, 0)).toISOString(),
  //     contentVariables: JSON.stringify({
  //       1: "다음을 읽고 내용이 같은 것을 고르십시오.", // 질문
  //       2: "저는 친구와 함께 기숙사에 삽니다. 우리는 기숙사에서 한국 아이돌의 노래를 매일 듣습니다. 주말에는 같이 노래방에 갑니다.\n① 주말에는 각자 쉽니다.\n② 우리는 한국 노래를 가끔 듣습니다.\n③ 친구는 저와 함께 삽니다.\n④ 친구는 혼자 노래방에 갑니다.", // 보기
  //       3: "③ 친구는 저와 함께 삽니다.", // 정답
  //       4: "Jawaban yang benar adalah ③ 친구는 저와 함께 삽니다 (Teman saya tinggal bersama saya). Bagian tersebut menyatakan bahwa pembicara tinggal di asrama bersama seorang teman, mendengarkan lagu K-pop setiap hari, dan pergi karaoke bersama.", // 해설
  //     }),
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );

  sendWelcomeMessage();
  return res.json({ message: "WhatsApp 메시지가 성공적으로 발송되었습니다." });
  // return sendTodayWord();
  console.log(process.env.TEMPLATE_WELCOME);
  await client.messages.create(
    {
      from: process.env.FROM_PHONE_NUMBER,
      to: "whatsapp:+821041225996",
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
  // await client.messages.create(
  //   {
  //     from: process.env.FROM_PHONE_NUMBER,
  //     to: "whatsapp:+821045709002",
  //     contentSid: process.env.TEMPLATE_WELCOME,
  //     messagingServiceSid: "MGc11b68678a2fa216588c979110f444fe",
  //     // contentVariables: JSON.stringify({
  //     //   1: "Name",
  //     // }),
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );

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

const sendTodayWord = async () => {
  try {
    const activeUsers = await db.User.findAll({
      where: { status: "active" },
    });

    const todayWord = await db.Word.findOne({
      where: { id: 1 },
    });

    const result = [];
    for (const user of activeUsers) {
      const phoneNumber = user.phoneNumber; // 가정: User 모델에 phoneNumber 필드가 있다고 가정합니다.
      await client.messages.create(
        {
          from: process.env.FROM_PHONE_NUMBER,
          to: `whatsapp:${phoneNumber}`,
          contentSid: process.env.TEMPLATE_DAILY_CONVERSATION,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: new Date("2021-11-30 20:36:27"),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3: todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6: todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        },
        (error) => {
          console.log(error);
        }
      );
      // // WhatsApp 메시지 발송 API 호출
      // const response = await axios.post(
      //   "/messages",
      //   {
      //     messaging_product: "whatsapp",
      //     to: "+821020252266",
      //     type: "template",
      //     template: {
      //       name: process.env.TEMPLATE_WELCOME,
      //       language: {
      //         code: "id_ID",
      //       },
      //     },
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );
      // result.push(response.data);
    }
  } catch (error) {
    console.log(error);
  }
};

// cron.schedule("40 1 * * *", () => {
//   if (process.env.NODE_ENV === "production") {
//     sendTodayWord();
//   }
// });
// const db = require("../models");

// 구독기간이 현재 진행 중인 사용자 목록을 가져오는 함수
async function fetchActiveSubscriptions() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // 로컬 시간으로 설정
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // 로컬 시간으로 설정
  console.log(todayStart, todayEnd);

  return await db.Subscription.findAll({
    where: {
      subscriptionDate: {
        [db.Sequelize.Op.lte]: todayEnd,
      },
      expirationDate: {
        [db.Sequelize.Op.gte]: todayStart,
      },
    },
    include: [
      {
        model: db.User,
        attributes: ["id", "name", "phoneNumber"],
      },
    ],
  });
}

const sendDailyMessage = async () => {
  const categorizedSubscriptions = {};

  // 구독기간이 현재 진행 중인 사용자 목록을 카테고리별로 분류
  const activeSubscriptions = await fetchActiveSubscriptions();
  activeSubscriptions.forEach((subscription) => {
    const category = subscription.type || "daily_conversation";
    if (!categorizedSubscriptions[category]) {
      categorizedSubscriptions[category] = [];
    }
    categorizedSubscriptions[category].push(subscription);
  });

  // 카테고리별로 함수 실행
  Object.keys(categorizedSubscriptions).forEach((category) => {
    const subscriptions = categorizedSubscriptions[category];
    console.log(`카테고리: ${category}, 구독자 수: ${subscriptions.length}`);
    // 여기에 카테고리별로 실행할 함수를 호출할 수 있습니다.
    processCategorySubscriptions(category, subscriptions);
  });
};

const processCategorySubscriptions = async (category, subscriptions) => {
  if (category === "daily_conversation") {
    subscriptions.forEach(async (subscription) => {
      const todayWord = await db.Word.findOne({
        where: {
          id: {
            [db.Sequelize.Op.gt]: subscription.lastWordId,
          },
          type: "daily_conversation",
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_DAILY_CONVERSATION,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: new Date(Date.now() + 10 * 60000), // 10분 후 메시지 전송
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
            [db.Sequelize.Op.gt]: subscription.lastWordId,
          },
          type: "kpop_lyrics",
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_KPOP_LYRICS,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: new Date(Date.now() + 10 * 60000), // 10분 후 메시지 전송
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
            [db.Sequelize.Op.gt]: subscription.lastWordId,
          },
          type: "topik_word",
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      try {
        const response = await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          to,
          contentSid: process.env.TEMPLATE_TOPIK_WORD,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          scheduleType: "fixed",
          sendAt: new Date(Date.now() + 10 * 60000), // 10분 후 메시지 전송
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
            [db.Sequelize.Op.gt]: subscription.lastWordId,
          },
          type: "topik_variation",
        },
        order: [["id", "ASC"]],
        limit: 1,
      });

      const to = `whatsapp:${subscription.User.phoneNumber}`;
      const hasImage = todayQuestion.imageUrl ? true : false;

      const contentVariables = hasImage
        ? JSON.stringify({
            1: todayQuestion.imageUrl?.trim(), // 이미지
            2: todayQuestion.title?.trim(), // 질문
            3: todayQuestion.description?.trim(), // 보기
            4: todayQuestion.answer?.trim(), // 정답
            5: todayQuestion.explanation?.trim(), // 해설
          })
        : JSON.stringify({
            1: todayQuestion.title?.trim(), // 질문
            2: todayQuestion.description?.trim(), // 보기
            3: todayQuestion.answer?.trim(), // 정답
            4: todayQuestion.explanation?.trim(), // 해설
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
          sendAt: new Date(Date.now() + 10 * 60000), // 10분 후 메시지 전송
          contentVariables,
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayQuestion.id });
      } catch (error) {
        console.error(
          `Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
      }
    });
  }
};

async function fetchSubscriptionsStartingToday() {
  const todayStart = new Date();
  todayStart.setFullYear(2024, 6, 1); // 7월 1일로 설정 (월은 0부터 시작하므로 6은 7월을 의미)
  todayStart.setHours(0, 0, 0, 0); // 오늘의 시작 시간 설정
  const todayEnd = new Date();
  todayEnd.setFullYear(2024, 6, 1); // 7월 1일로 설정
  todayEnd.setHours(23, 59, 59, 999); // 오늘의 종료 시간 설정

  console.log(todayStart, todayEnd);
  try {
    const response = await db.Subscription.findAll({
      where: {
        subscriptionDate: {
          [db.Sequelize.Op.gte]: todayStart,
          [db.Sequelize.Op.lte]: todayEnd,
        },
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
          sendAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
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

module.exports = router;
