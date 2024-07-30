const express = require("express");
const router = express.Router();
const db = require("../models");
const twilio = require("twilio");
const cron = require("node-cron");
const redis = require("../redis");
const { bot } = require("../services/telegramBot"); // 텔레그램 봇 가져오기
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
        [db.Sequelize.db.Sequelize.Op.lte]: todayEnd,
      },
      expirationDate: {
        [db.Sequelize.db.Sequelize.Op.gte]: todayStart,
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

// 한국 시간 오전 11시에 예약된 메시지를 전송하는 함수
const sendScheduledMessages = async () => {
  let count = 0;
  while (true) {
    const message = await redis.rpop("telegram_message_queue");
    if (message) {
      count++;
      const { chatId, text } = JSON.parse(message);
      // 메시지 처리 (예: 텔레그램 봇으로 전송)
      await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });

      // 50ms 대기하여 초당 20개 메시지 전송 제한을 준수
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      // 큐가 비어있으면 루프 종료
      break;
    }
  }

  sendSlack(`[텔레그램 메시지] 예약된 메시지 ${count}개 발송 완료`);
};

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
          [db.Sequelize.Op.or]: [
            { [db.Sequelize.Op.like]: `${platform}_1` },
            { [db.Sequelize.Op.like]: `${platform}_3` },
            { [db.Sequelize.Op.like]: `${platform}_6` },
            { [db.Sequelize.Op.like]: `${platform}_12` },
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

        const quizContents = words
          .map((word) => `\[${word.korean}\] :`)
          .join("\n");

        if (subscription.User.chatId) {
          await redis.lpush(
            "telegram_message_queue",
            JSON.stringify({
              chatId: subscription.User.chatId,
              text: `*It's time for weekly QUIZ!*\n\n${quizContents}`,
            })
          );
        } else {
          sendSlack(
            `[주간 퀴즈] ${subscription.User.name}의 chatId가 없습니다.`
          );
        }
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

cron.schedule("0 2 * * *", async () => {
  // 매일 한국시간 오전 11시 (UTC+9)
  if (process.env.NODE_ENV === "development") {
    return;
  }
  sendSlack("[텔레그램 메시지] 예약된 메시지 발송 시작");

  try {
    await sendScheduledMessages();
  } catch (error) {
    sendSlack("[텔레그램 메시지] 작업 중 오류 발생: " + error.message);
  }
});

cron.schedule("14 15 * * 0", async () => {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  try {
    sendSlack(`[주간 퀴즈] Telegram 퀴즈 발송 예약 시작`);

    await sendWeeklyQuiz("telegram");

    sendSlack(`[주간 퀴즈] Telegram 퀴즈 발송 예약 완료`);
  } catch (error) {
    if (error.status === 404) {
      sendSlack("[주간 퀴즈] Telegram 요청한 사용자를 찾을 수 없습니다.");
    } else {
      sendSlack(
        "[주간 퀴즈] Telegram 서버 오류로 인해 메시지를 발송할 수 없습니다." +
          error.message
      );
    }
  }
});

module.exports = router;
