const express = require("express");
const router = express.Router();
const db = require("../models");
const checkToken = require("../middlewares/checkToken");
const redis = require("../redis");
const slack = require("axios").create({
  baseURL: "https://hooks.slack.com/services",
});

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

// 사용자 생성
/**
 * @swagger
 * /subscription:
 *   post:
 *     summary: 사용자 생성
 *     description: 새로운 사용자를 생성합니다.
 *     tags:
 *       - Subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *               - email
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               phoneNumber:
 *                 type: string
 *                 description: 사용자 전화번호
 *               email:
 *                 type: string
 *                 description: 사용자 이메일
 *               type:
 *                 type: string
 *                 description: 구독 타입
 *     responses:
 *       200:
 *         description: 성공적으로 생성된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 구독 ID
 *                 userId:
 *                   type: integer
 *                   description: 사용자 ID
 *                 type:
 *                   type: string
 *                   description: 구독 타입
 *                 subscriptionDate:
 *                   type: string
 *                   format: date-time
 *                   description: 구독 시작 날짜
 *                 expirationDate:
 *                   type: string
 *                   format: date-time
 *                   description: 구독 만료 날짜
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  if (process.env.NODE_ENV === "development") {
    console.log("테스트");
    return;
  }
  const { name, phoneNumber, email, type, quiz, zoom, plan } = req.body;
  console.log("new", req.body);

  if (!name || !phoneNumber || !email || !type || !plan) {
    console.log("[error] 모든 필드를 입력해주세요.");
    return res.status(400).json({ error: "모든 필드를 입력해주세요." });
  }

  const phoneNumberRegex = /^\+\d{1,3}\d{7,14}$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    console.log("[error] 전화번호 형식이 올바르지 않습니다.");
    return res.status(400).json({
      error:
        "전화번호 형식이 올바르지 않습니다. 국가번호와 숫자만 포함되어야 합니다.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log("[error] 이메일 형식이 올바르지 않습니다.");
    return res.status(400).json({ error: "이메일 형식이 올바르지 않습니다." });
  }
  const validTypes = [
    "basic",
    "daily_conversation",
    "kpop_lyrics",
    "topik_word",
    "topik_variation",
  ];

  if (type.length === 0 || !type.every((t) => validTypes.includes(t))) {
    console.log("[error] 유효하지 않은 구독 타입이 포함되어 있습니다.");
    return res
      .status(400)
      .json({ error: "유효하지 않은 구독 타입이 포함되어 있습니다." });
  }

  const validPlans = [
    "telegram_1",
    "telegram_3",
    "telegram_12",
    "whatsapp_1",
    "whatsapp_3",
    "whatsapp_12",
  ];
  if (plan.length === 0 || !validPlans.includes(plan)) {
    console.log("[error] 유효하지 않은 플랜이 포함되어 있습니다.");
    return res
      .status(400)
      .json({ error: "유효하지 않은 플랜이 포함되어 있습니다." });
  }

  let startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  const comparisonDate = new Date("2024-08-01");
  if (startDate < comparisonDate) {
    startDate = comparisonDate;
  }
  const month = Number(plan.split("_")[1]);

  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + month);

  // Redis 주입
  await redis.lpush(
    "request_subscription",
    JSON.stringify({
      name,
      phoneNumber,
      type,
      plan,
      email,
      startDate,
      endDate,
      quiz,
      zoom,
    })
  );

  sendSlack(
    `[예약완료] 새로운 사용자 등록: ${name} (${phoneNumber}) ${type} 이 예약되었습니다.`
  );

  try {
    const user = await db.User.findOne({
      where: { id: 1 },
    });

    sendSlack("[DB 깨우기] 사용자 예약을 위한 DB 깨우기 시도");
  } catch (e) {
    sendSlack("[DB 깨우기] 사용자 예약을 위한 DB 깨우기 시도");
  }

  const code = "M1GJ978F";
  res.status(200).json({
    message:
      "사용자 등록이 예약되었습니다. 1분 이내로 안내 메세지가 발송됩니다.",
    code: plan.includes("telegram") ? code : null,
  });
  // try {
  //   let user = await db.User.findOne({ where: { phoneNumber, email } });

  //   if (!user) {
  //     user = await db.User.create({
  //       name,
  //       phoneNumber,
  //       email,
  //       status: "active",
  //     });
  //   }

  //   const newSubscription = await db.Subscription.create({
  //     userId: user.id,
  //     type,
  //     subscriptionDate: startDate,
  //     expirationDate: endDate,
  //   });

  //   // 시작 안내 메세지 발송
  //   res.json(newSubscription);
  // } catch (error) {
  //   sendSlack(
  //     `[유저 등록 에러] 새로운 사용자 등록 중에 에러가 발생했습니다: ${user.name} (${user.phoneNumber}) ${type}`
  //   );

  //   console.error("Error creating user or subscription: ", error);
  //   res.status(500).json({ error: "서버 오류가 발생했습니다." });
  // }
});

module.exports = router;
