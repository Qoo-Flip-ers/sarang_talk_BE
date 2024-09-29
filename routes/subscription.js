const express = require("express");
const router = express.Router();
const db = require("../models");
const checkToken = require("../middlewares/checkToken");
const redis = require("../redis");
const slack = require("axios").create({
  baseURL: "https://hooks.slack.com/services",
});
const { v4: uuidv4 } = require("uuid");

const sendSlack = async (message) => {
  try {
    let text = `${
      process.env.NODE_ENV === "development" ? "[테스트 환경]" : ""
    }${message}`;
    const response = await slack.post(
      "/T0684TBHDKQ/B07AEG61MR8/GWc1HKf6Bk2U4gIsvfjV2M8I",
      {
        text,
      }
    );
  } catch (error) {
    console.error("Slack 메시지 전송 중 오류 발생:", error);
  }
};

/**
 * @swagger
 * /subscription:
 *   post:
 *     summary: 사용자 생성
 *     description: 새로운 사용자를 생성하고 구독을 예약합니다. 사용자는 이름, 전화번호, 이메일, 언어, 플랜, 플랫폼, 기간, 줌 멘토링 여부, 테스트 여부를 제공해야 합니다.
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
 *               - lang
 *               - plan
 *               - platform
 *               - duration
 *               - zoom_mentoring
 *               - test
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               phoneNumber:
 *                 type: string
 *                 description: 사용자 전화번호 (국가 코드 포함)
 *               email:
 *                 type: string
 *                 description: 사용자 이메일
 *               lang:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 사용자 언어 (예: ["KO", "EN"])
 *               plan:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 구독 플랜 (예: ["beginners", "basic"])
 *               platform:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 사용 플랫폼 (예: ["telegram", "whatsapp"])
 *               duration:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 구독 기간 (예: ["1", "3", "12"])
 *               zoom_mentoring:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 줌 멘토링 여부 (예: ["yes", "no"])
 *               test:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 테스트 여부 (예: ["true", "false"])
 *     responses:
 *       200:
 *         description: 성공적으로 예약된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 사용자 등록 예약 메시지
 *       400:
 *         description: 잘못된 요청 (필수 필드 누락, 형식 오류 등)
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  if (process.env.NODE_ENV === "development") {
    console.log("테스트");
    return;
  }

  const {
    name,
    phoneNumber,
    email,
    lang,
    plan,
    platform,
    duration,
    zoom_mentoring,
    test,
  } = req.body;

  console.log("새로운 요청:", req.body);
  // 새로운 형식을 기존 형식으로 변환
  const type = plan[0] === "beginners" ? "basic" : plan[0] || "";
  const zoom = zoom_mentoring[0] === "yes" ? "zoom" : "";
  const convertedPlan = `${platform[0]}_${duration[0]}`;
  const convertedLang = lang[0] || "";
  const convertedTest = test[0] === "true" ? true : false;

  // 기존 유효성 검사 로직
  if (!name || !phoneNumber || !email || !type || !convertedPlan) {
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
    "beginners",
    "daily_conversation",
    "kpop_lyrics",
    "topik_word",
    "topik_variation",
  ];

  const formattingType = type.split(",").map((t) => t.trim());

  const formattingZoom = zoom ? zoom.split(",").map((t) => t.trim()) : [];

  if (
    formattingType.length === 0 ||
    !formattingType.every((t) => validTypes.includes(t))
  ) {
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

  if (!validPlans.includes(convertedPlan)) {
    console.log("[error] 유효하지 않은 플랜이 포함되어 있습니다.");
    return res
      .status(400)
      .json({ error: "유효하지 않은 플랜이 포함되어 있습니다." });
  }

  let startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  if (lang === "EN") {
    const canadaStartDate = new Date("2024-10-14T00:00:00-04:00"); // 캐나다 동부 시간 기준
    if (startDate < canadaStartDate) {
      startDate = canadaStartDate;
    }
  }

  const month = duration;

  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + month);

  let code;
  let codeGeneratedAt;

  if (convertedPlan.includes("telegram")) {
    code = uuidv4();
    codeGeneratedAt = new Date();
  }

  if (convertedTest) {
    sendSlack(`[테스트] 테스트 값이 들어왔습니다. ${test} , ${typeof test}`);
    console.log("테스트모드");
    return res.status(200).json({
      message:
        "사용자 등록이 예약되었습니다. 1분 이내로 안내 메세지가 발송됩니다.",
      code: plan.includes("telegram") ? code : null,
    });
  }

  // Redis 주입
  await redis.lpush(
    "request_subscription",
    JSON.stringify({
      name,
      phoneNumber,
      type: formattingType,
      plan,
      email,
      startDate,
      endDate,
      zoom: formattingZoom,
      code,
      codeGeneratedAt,
      lang: convertedLang.toUpperCase(),
    })
  );

  sendSlack(
    `[예약완료] 새로운 사용자 등록: ${name} (${phoneNumber}) ${type} 이 예약되었습니다. ${
      code ? `(코드: ${code})` : ""
    }`
  );

  try {
    const user = await db.User.findOne({
      where: { id: 1 },
    });

    sendSlack("[DB 깨우기] 사용자 예약을 위한 DB 깨우기 시도");
  } catch (e) {
    sendSlack("[DB 깨우기] 사용자 예약을 위한 DB 깨우기 시도");
  }

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
