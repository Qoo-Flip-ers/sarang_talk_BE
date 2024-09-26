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
 * /whatsapp/daily:
 *   post:
 *     summary: 일일 대화 메시지 발송
 *     description: 특정 사용자에게 일일 대화 메시지를 발송합니다.
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 사용자의 전화번호
 *                 example: "+821020252266"
 *               lang:
 *                 type: string
 *                 description: 메시지 언어 (EN 또는 ID)
 *                 example: "EN"
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
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "sent"
 *       404:
 *         description: 오늘의 단어가 없습니다.
 *       500:
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/daily", async (req, res) => {
  const { phoneNumber = "+821020252266", lang = "EN" } = req.body;

  const todayWord = await db.Word.findOne({
    where: {
      id: {
        [db.Sequelize.Op.gt]: 0,
      },
      type: {
        [db.Sequelize.Op.eq]: "daily_conversation",
      },
      ...(lang === "EN"
        ? { en_description: { [db.Sequelize.Op.ne]: null } }
        : { description: { [db.Sequelize.Op.ne]: null } }),
    },
    order: [["id", "ASC"]],
    limit: 1,
  });

  if (!todayWord) {
    sendSlack(`오늘의 단어가 없습니다.`);
    return res.status(404).json({ message: "오늘의 단어가 없습니다." });
  }

  const to = `whatsapp:${phoneNumber}`;

  try {
    const response = await client.messages.create({
      from: process.env.FROM_PHONE_NUMBER,
      messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
      to,
      contentSid:
        lang === "EN"
          ? process.env.TEMPLATE_EN_DAILY_CONVERSATION
          : process.env.TEMPLATE_DAILY_CONVERSATION,
      contentVariables: JSON.stringify({
        1: todayWord.korean?.trim(),
        2: todayWord.pronunciation?.trim(),
        3:
          lang === "EN"
            ? todayWord.en_description?.trim()
            : todayWord.description?.trim(),
        4: todayWord.example_1?.trim(),
        5: todayWord.example_2?.trim(),
        6:
          lang === "EN"
            ? todayWord.en_example_3?.trim()
            : todayWord.example_3?.trim(),
      }),
    });

    console.log("예약된 메시지가 다음 사용자에게 전송되었습니다:", phoneNumber);
    if (todayWord.imageUrl) {
      setTimeout(async () => {
        await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          to,
          mediaUrl:
            "https://annyeongwa.blob.core.windows.net/images/Frame_6929.png",
        });
        console.log("이미지 메시지가 5초 후에 전송되었습니다");
      }, 5000);
    }

    if (todayWord.audioUrl) {
      setTimeout(async () => {
        await client.messages.create({
          from: process.env.FROM_PHONE_NUMBER,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          to,
          mediaUrl: [
            "https://annyeongwa.blob.core.windows.net/images/Frame_6929.png",
          ],
        });
        console.log("오디오 메시지가 10초 후에 전송되었습니다");
      }, 10000);
    }

    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      response: { status: "good" },
    });
  } catch (error) {
    console.error(`Error sending message to ${phoneNumber}:`, error);
    res.status(500).json({ message: "메시지 발송 중 오류가 발생했습니다." });
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: 메시지 카테고리
 *               lang:
 *                 type: string
 *                 description: 언어 코드
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
  try {
    const { category, lang } = req.body;
    let count = 0;
    const categorizedSubscriptions = {};

    // 구독기간이 현재 진행 중인 사용자 목록을 카테고리별로 분류
    const activeSubscriptions = await fetchActiveSubscriptions(category, lang);
    activeSubscriptions.forEach((subscription) => {
      const category = subscription.type || "daily_conversation";
      if (!categorizedSubscriptions[category]) {
        categorizedSubscriptions[category] = [];
      }
      categorizedSubscriptions[category].push(subscription);
    });

    // 카테고리별로 함수 실행
    for (const category of Object.keys(categorizedSubscriptions)) {
      const subscriptions = categorizedSubscriptions[category];
      sendSlack(
        `카테고리: ${category}, 언어: ${lang}, 구독자 수: ${subscriptions.length}`
      );
      console.log(
        `카테고리: ${category}, 언어: ${lang}, 구독자 수: ${subscriptions.length}`
      );

      for (let i = 0; i < subscriptions.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200)); // 0.2초 간격으로 호출
        count += await processCategorySubscriptions(
          category,
          [subscriptions[i]],
          lang,
          true
        );
      }
    }

    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      count: count,
    });
  } catch (error) {
    console.error(error);
    if (error.status === 404) {
      res.status(404).json({
        message:
          "요청한 카테고리 또는 언어에 해당하는 사용자를 찾을 수 없습니다.",
      });
    } else {
      res.status(500).json({
        message: "서버 내부 오류로 인해 메시지를 발송할 수 없습니다.",
      });
    }
  }
});

/**
 * @swagger
 * /whatsapp/send-lang:
 *   post:
 *     summary: 메시지 전송
 *     description: 카테고리와 언어에 해당하는 사용자들에게 메시지를 전송합니다.
 *     tags:
 *       - WhatsApp
 *     operationId: sendMessage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: 메시지를 받을 사용자들의 카테고리
 *               lang:
 *                 type: string
 *                 description: 메시지 언어 (예: 'ID' 또는 'EN')
 *     responses:
 *       '200':
 *         description: 메시지가 성공적으로 발송되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "메시지가 성공적으로 발송되었습니다."
 *                 count:
 *                   type: number
 *                   example: 10
 *                   description: 메시지를 받은 사용자 수
 *       '404':
 *         description: 요청한 카테고리 또는 언어에 해당하는 사용자를 찾을 수 없습니다.
 *       '500':
 *         description: 서버 내부 오류로 인해 메시지를 발송할 수 없습니다.
 */
router.post("/send-lang", async (req, res) => {
  try {
    const { category, lang } = req.body;
    let count = 0;
    const categorizedSubscriptions = {};

    // 구독기간이 현재 진행 중인 사용자 목록을 카테고리별로 분류
    const activeSubscriptions = await fetchActiveSubscriptions(category, lang);
    activeSubscriptions.forEach((subscription) => {
      const category = subscription.type || "daily_conversation";
      if (!categorizedSubscriptions[category]) {
        categorizedSubscriptions[category] = [];
      }
      categorizedSubscriptions[category].push(subscription);
    });

    // 카테고리별로 함수 실행
    for (const category of Object.keys(categorizedSubscriptions)) {
      const subscriptions = categorizedSubscriptions[category];
      sendSlack(
        `카테고리: ${category}, 언어: ${lang}, 구독자 수: ${subscriptions.length}`
      );
      console.log(
        `카테고리: ${category}, 언어: ${lang}, 구독자 수: ${subscriptions.length}`
      );

      for (let i = 0; i < subscriptions.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200)); // 0.2초 간격으로 호출
        count += await processCategorySubscriptions(
          category,
          [subscriptions[i]],
          lang
        );
      }
    }

    res.status(200).json({
      message: "메시지가 성공적으로 발송되었습니다.",
      count: count,
    });
  } catch (error) {
    console.error(error);
    if (error.status === 404) {
      res.status(404).json({
        message:
          "요청한 카테고리 또는 언어에 해당하는 사용자를 찾을 수 없습니다.",
      });
    } else {
      res.status(500).json({
        message: "서버 내부 오류로 인해 메시지를 발송할 수 없습니다.",
      });
    }
  }
});

// 구독기간이 현재 진행 중인 사용자 목록을 가져오는 함수
async function fetchActiveSubscriptions(category, lang = "ID") {
  const now = new Date();

  let todayStart, todayEnd;

  if (lang === "EN") {
    // 캐나다 시간은 UTC-4 (여름 시간 기준), 현재 캐나다 시간 계산
    const canadaOffset = -4 * 60 * 60 * 1000;
    const canadaNow = new Date(now.getTime() + canadaOffset);

    // 캐나다 시간 기준 현재 날짜
    let year = canadaNow.getFullYear();
    let month = canadaNow.getMonth();
    let date = canadaNow.getDate();

    todayStart = new Date(Date.UTC(year, month, date, 4, 0, 0, 0)); // 캐나다 시간 자정
    todayEnd = new Date(Date.UTC(year, month, date, 27, 59, 59, 999)); // 캐나다 시간 23:59:59
  } else {
    // 한국/인도네시아 시간은 UTC+9/UTC+7, 현재 한국 시간 계산 (인도네시아도 같은 날짜 범위 사용)
    const koreaOffset = 9 * 60 * 60 * 1000;
    const koreaNow = new Date(now.getTime() + koreaOffset);

    // 한국 시간 기준 현재 날짜
    let year = koreaNow.getFullYear();
    let month = koreaNow.getMonth();
    let date = koreaNow.getDate();

    todayStart = new Date(Date.UTC(year, month, date - 1, 15, 0, 0, 0)); // 한국 시간으로 설정
    todayEnd = new Date(Date.UTC(year, month, date, 14, 59, 59, 999)); // 한국 시간으로 설정
  }

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
      plan: {
        [db.Sequelize.Op.in]: ["whatsapp_1", "whatsapp_3", "whatsapp_12"],
      },
    },
    include: [
      {
        model: db.User,
        where: { language: lang },
        attributes: ["id", "name", "phoneNumber", "language"],
      },
    ],
  });
}

const sendDailyMessage = async (category, lang = "ID") => {
  let count = 0;
  const categorizedSubscriptions = {};

  // 구독기간이 현재 진행 중인 사용자 목록을 카테고리별로 분류
  const activeSubscriptions = await fetchActiveSubscriptions(category, lang);
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
        count += await processCategorySubscriptions(
          category,
          [subscription],
          lang
        );
      }, index * 500); // 0.5초 간격으로 호출
    });
  });

  return count;
};

const processCategorySubscriptions = async (
  category,
  subscriptions,
  lang = "ID",
  force = false
) => {
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
          ...(lang === "EN"
            ? { en_description: { [db.Sequelize.Op.ne]: null } }
            : { description: { [db.Sequelize.Op.ne]: null } }),
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
          contentSid:
            lang === "EN"
              ? process.env.TEMPLATE_EN_DAILY_CONVERSATION
              : process.env.TEMPLATE_DAILY_CONVERSATION,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          ...(force ? {} : { scheduleType: "fixed", sendAt: getSendAt(lang) }),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(),
            2: todayWord.pronunciation?.trim(),
            3:
              lang === "EN"
                ? todayWord.en_description?.trim()
                : todayWord.description?.trim(),
            4: todayWord.example_1?.trim(),
            5: todayWord.example_2?.trim(),
            6:
              lang === "EN"
                ? todayWord.en_example_3?.trim()
                : todayWord.example_3?.trim(),
          }),
        });
        console.log(
          "예약된 메시지가 다음 사용자에게 전송되었습니다:",
          subscription.User.name
        );

        // 메시지 전송 후 lastWordId 업데이트
        await subscription.update({ lastWordId: todayWord.id });

        if (todayWord.imageUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.imageUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "image") }),
          });
          console.log(
            "이미지 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }

        if (todayWord.audioUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.audioUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "audio") }),
          });
          console.log(
            "오디오 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }

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
          ...(lang === "EN"
            ? { en_description: { [db.Sequelize.Op.ne]: null } }
            : { description: { [db.Sequelize.Op.ne]: null } }),
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
          contentSid:
            lang === "EN"
              ? process.env.TEMPLATE_EN_TOPIK_WORD
              : process.env.TEMPLATE_TOPIK_WORD,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          ...(force ? {} : { scheduleType: "fixed", sendAt: getSendAt(lang) }),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3:
              lang === "EN"
                ? todayWord.en_description?.trim()
                : todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6:
              lang === "EN"
                ? todayWord.en_example_3?.trim()
                : todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log("Scheduled message sent to", subscription.User.name);

        await subscription.update({ lastWordId: todayWord.id });

        if (todayWord.imageUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.imageUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "image") }),
          });
          console.log(
            "이미지 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }

        if (todayWord.audioUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.audioUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "audio") }),
          });
          console.log(
            "오디오 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }

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
          ...(lang === "EN"
            ? { en_description: { [db.Sequelize.Op.ne]: null } }
            : { description: { [db.Sequelize.Op.ne]: null } }),
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
          contentSid:
            lang === "EN"
              ? process.env.TEMPLATE_EN_BASIC
              : process.env.TEMPLATE_BASIC,
          messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
          ...(force ? {} : { scheduleType: "fixed", sendAt: getSendAt(lang) }),
          contentVariables: JSON.stringify({
            1: todayWord.korean?.trim(), // korean
            2: todayWord.pronunciation?.trim(), // pronunciation
            3:
              lang === "EN"
                ? todayWord.en_description?.trim()
                : todayWord.description?.trim(), // description
            4: todayWord.example_1?.trim(), // example_1
            5: todayWord.example_2?.trim(), // example_2 (예문 발음기호)
            6:
              lang === "EN"
                ? todayWord.en_example_3?.trim()
                : todayWord.example_3?.trim(), // example_3 (에문 설명)
          }),
        });
        console.log(
          "예약된 메시지가 다음 사용자에게 전송되었습니다:",
          subscription.User.name
        );

        // 메시지 전송 후 lastWordId 업데이트
        await subscription.update({ lastWordId: todayWord.id });

        if (todayWord.imageUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.imageUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "image") }),
          });
          console.log(
            "이미지 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }

        if (todayWord.audioUrl) {
          await client.messages.create({
            from: process.env.FROM_PHONE_NUMBER,
            to,
            mediaUrl: [todayWord.audioUrl],
            messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
            ...(force
              ? {}
              : { scheduleType: "fixed", sendAt: getSendAt(lang, "audio") }),
          });
          console.log(
            "오디오 메시지가 예약되었습니다:",
            subscription.User.name
          );
        }
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
          [db.Sequelize.Op.ne]: null,
        },
        plan: {
          [db.Sequelize.Op.in]: [
            `${platform}_1`,
            `${platform}_3`,
            `${platform}_6`,
            `${platform}_12`,
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
              [db.Sequelize.Op.lte]: subscription.lastWordId,
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

const getSendAt = (lang = "ID", type = "template") => {
  // 현재 UTC 시간
  const now = new Date();

  if (lang === "EN") {
    // 캐나다 동부 시간은 UTC-4 (서머타임 고려), 현재 캐나다 시간 계산
    const canadaOffset = -4 * 60 * 60 * 1000;
    const canadaNow = new Date(now.getTime() + canadaOffset);

    // 캐나다 시간 기준 현재 날짜
    let year = canadaNow.getFullYear();
    let month = canadaNow.getMonth();
    let date = canadaNow.getDate();

    // 캐나다 시간 기준 해당 날짜의 오전 9시를 UTC로 변환
    let sendAt = new Date(Date.UTC(year, month, date, 13, 0, 0, 0));

    if (type === "image") {
      sendAt.setSeconds(sendAt.getSeconds() + 5);
    } else if (type === "audio") {
      sendAt.setSeconds(sendAt.getSeconds() + 10);
    }

    console.log(`EN: Generated sendAt date: ${sendAt.toISOString()}`);
    return sendAt.toISOString();
  }

  // 한국 시간은 UTC+9, 현재 한국 시간 계산
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(now.getTime() + koreaOffset);

  // 한국 시간 기준 현재 날짜
  let year = koreaNow.getFullYear();
  let month = koreaNow.getMonth();
  let date = koreaNow.getDate();

  // 한국 시간 기준 해당 날짜의 오전 11시를 UTC로 변환
  let sendAt = new Date(Date.UTC(year, month, date, 2, 0, 0, 0));

  if (type === "image") {
    sendAt.setSeconds(sendAt.getSeconds() + 5);
  } else if (type === "audio") {
    sendAt.setSeconds(sendAt.getSeconds() + 10);
  }

  console.log(`ID: Generated sendAt date: ${sendAt.toISOString()}`);
  return sendAt.toISOString();
};

// ------------------------ 인도네시아 ------------------------
// 인도네시아용 DB 깨우기 (serverless 때문에)
cron.schedule("0 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] 인도네시아용 DB 깨우기 시도");
    }
  } catch (e) {
    sendSlack("[준비] 인도네시아용 DB 깨우기 시도");
  }
});

// 인도네시아용 DB 깨우기 (serverless 때문에)
cron.schedule("2 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] 인도네시아용 DB 깨우기 성공");
    }
  } catch (e) {
    sendSlack("[준비] 인도네시아용 DB 깨우기 실패");
  }
});

// 인도네시아용 메시지 발송
cron.schedule("4 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("basic", "ID");
      sendSlack(`[일일 메시지] 인도네시아 basic: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 인도네시아 basic: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 인도네시아 basic: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 인도네시아 basic: 작업 중 오류 발생");
  }
});

cron.schedule("5 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("kpop_lyrics", "ID");
      sendSlack(
        `[일일 메시지] 인도네시아 kpop_lyrics: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 인도네시아 kpop_lyrics: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 인도네시아 kpop_lyrics: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 인도네시아 kpop_lyrics: 작업 중 오류 발생");
  }
});

cron.schedule("6 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_word", "ID");
      sendSlack(
        `[일일 메시지] 인도네시아 topik_word: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 인도네시아 topik_word: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 인도네시아 topik_word: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 인도네시아 topik_word: 작업 중 오류 발생");
  }
});

cron.schedule("7 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_variation", "ID");
      sendSlack(
        `[일일 메시지] 인도네시아 topik_variation: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 인도네시아 topik_variation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 인도네시아 topik_variation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 인도네시아 topik_variation: 작업 중 오류 발생");
  }
});

cron.schedule("8 15 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("daily_conversation", "ID");
      sendSlack(
        `[일일 메시지] 인도네시아 daily_conversation: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 인도네시아 daily_conversation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 인도네시아 daily_conversation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 인도네시아 daily_conversation: 작업 중 오류 발생");
  }
});

// 인도네시아용 주간 퀴즈
cron.schedule("12 15 * * 0", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  try {
    sendSlack(`[주간 퀴즈] 인도네시아 Whatsapp 퀴즈 발송 예약 시작`);

    await sendWeeklyQuiz("whatsapp", "ID");

    sendSlack(`[주간 퀴즈] 인도네시아 Whatsapp 퀴즈 발송 예약 완료`);
  } catch (error) {
    if (error.status === 404) {
      sendSlack(
        "[주간 퀴즈] 인도네시아 Whatsapp 요청한 사용자를 찾을 수 없습니다."
      );
    } else {
      sendSlack(
        "[주간 퀴즈] 인도네시아 Whatsapp 서버 오류로 인해 메시지를 발송할 수 없습니다." +
          error.message
      );
    }
  }
});

// ------------------------// 인도네시아 ------------------------

// ------------------------ 캐나다 ------------------------
// 캐나다용 DB 깨우기 (serverless 때문에)
cron.schedule("0 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] 캐나다용 DB 깨우기 시도");
    }
  } catch (e) {
    sendSlack("[준비] 캐나다용 DB 깨우기 시도");
  }
});

// 캐나다용 DB 깨우기 (serverless 때문에)
cron.schedule("2 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    const word = await db.Word.findByPk(1);
    if (word) {
      sendSlack("[준비] 캐나다용 DB 깨우기 성공");
    }
  } catch (e) {
    sendSlack("[준비] 캐나다용 DB 깨우기 실패");
  }
});

// 캐나다용 메시지 발송
cron.schedule("4 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("basic", "EN");
      sendSlack(`[일일 메시지] 캐나다 basic: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 캐나다 basic: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 캐나다 basic: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 캐나다 basic: 작업 중 오류 발생");
  }
});

cron.schedule("5 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("kpop_lyrics", "EN");
      sendSlack(`[일일 메시지] 캐나다 kpop_lyrics: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 캐나다 kpop_lyrics: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 캐나다 kpop_lyrics: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 캐나다 kpop_lyrics: 작업 중 오류 발생");
  }
});

cron.schedule("6 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_word", "EN");
      sendSlack(`[일일 메시지] 캐나다 topik_word: ${count}명에게 메시지 발송`);
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 캐나다 topik_word: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 캐나다 topik_word: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 캐나다 topik_word: 작업 중 오류 발생");
  }
});

cron.schedule("7 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("topik_variation", "EN");
      sendSlack(
        `[일일 메시지] 캐나다 topik_variation: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 캐나다 topik_variation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 캐나다 topik_variation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 캐나다 topik_variation: 작업 중 오류 발생");
  }
});

cron.schedule("8 13 * * *", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  try {
    try {
      const count = await sendDailyMessage("daily_conversation", "EN");
      sendSlack(
        `[일일 메시지] 캐나다 daily_conversation: ${count}명에게 메시지 발송`
      );
    } catch (error) {
      if (error.status === 404) {
        sendSlack(
          "[일일 메시지] 캐나다 daily_conversation: 요청한 사용자를 찾을 수 없습니다."
        );
      } else {
        sendSlack(
          "[일일 메시지] 캐나다 daily_conversation: 서버 오류로 인해 메시지를 발송할 수 없습니다." +
            error.message
        );
      }
    }
  } catch (error) {
    sendSlack("[일일 메시지] 캐나다 daily_conversation: 작업 중 오류 발생");
  }
});

// 캐나다용 주간 퀴즈
cron.schedule("12 13 * * 0", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  try {
    sendSlack(`[주간 퀴즈] 캐나다 Whatsapp 퀴즈 발송 예약 시작`);

    await sendWeeklyQuiz("whatsapp", "EN");

    sendSlack(`[주간 퀴즈] 캐나다 Whatsapp 퀴즈 발송 예약 완료`);
  } catch (error) {
    if (error.status === 404) {
      sendSlack(
        "[주간 퀴즈] 캐나다 Whatsapp 요청한 사용자를 찾을 수 없습니다."
      );
    } else {
      sendSlack(
        "[주간 퀴즈] 캐나다 Whatsapp 서버 오류로 인해 메시지를 발송할 수 없습니다." +
          error.message
      );
    }
  }
});

// ------------------------ // 캐나다 ------------------------

module.exports = router;
