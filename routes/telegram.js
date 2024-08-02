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
/**
 * @swagger
 * /telegram/send:
 *   post:
 *     summary: 메시지 전송
 *     description: 카테고리에 해당하는 사용자들에게 메시지를 전송합니다.
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
 *     responses:
 *       200:
 *         description: 메시지 전송 성공
 *       500:
 *         description: 서버 오류
 */
router.post("/send", async (req, res) => {
  const category = req.body.category;
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
      }, index * 200); // 0.5초 간격으로 호출
    });
  });

  return count;
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
        attributes: ["id", "name", "phoneNumber", "chatId"],
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
      }, index * 200); // 0.5초 간격으로 호출
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

      try {
        if (subscription.User.chatId) {
          const text = `*${todayWord.korean?.trim()}*\n\[_${todayWord.pronunciation?.trim()}_\]\n${todayWord.description?.trim()}\n\n*Example*\n${todayWord.example_1?.trim()}\n\[_${todayWord.example_2?.trim()}_\]\n${todayWord.example_3?.trim()}\n\n*안녕! Annyeong! 👋🏻*\nSilakan rekam atau ketik balasan Anda sesuai dengan ungkapan dan contoh kalimat hari ini 😊\n\n_Sent from Annyeong WA_`;

          await redis.lpush(
            "telegram_message_queue",
            JSON.stringify({
              chatId: subscription.User.chatId,
              text,
            })
          );

          // 메시지 전송 후 lastWordId 업데이트
          await subscription.update({ lastWordId: todayWord.id });

          // ReceivedWords에 기록 추가
          await db.ReceivedWords.create({
            userId: subscription.userId,
            wordId: todayWord.id,
            receivedDate: new Date(),
          });
        } else {
          sendSlack(
            `[daily_conversation] ${subscription.User.name}의 chatId가 없습니다.`
          );
        }
      } catch (error) {
        sendSlack(
          `[Error] Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
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

      try {
        if (subscription.User.chatId) {
          const text = `*${todayWord.korean?.trim()}*\n\[_${todayWord.pronunciation?.trim()}_\]\n${todayWord.description?.trim()}\n\n*Example*\n${todayWord.example_1?.trim()}\n\[_${todayWord.example_2?.trim()}_\]\n${todayWord.example_3?.trim()}\n\n*안녕! Annyeong! 👋🏻*\nSilakan rekam atau ketik balasan Anda sesuai dengan ungkapan dan contoh kalimat hari ini 😊\n\n_Sent from Annyeong WA_`;

          await redis.lpush(
            "telegram_message_queue",
            JSON.stringify({
              chatId: subscription.User.chatId,
              text,
            })
          );

          // 메시지 전송 후 lastWordId 업데이트
          await subscription.update({ lastWordId: todayWord.id });

          // ReceivedWords에 기록 추가
          await db.ReceivedWords.create({
            userId: subscription.userId,
            wordId: todayWord.id,
            receivedDate: new Date(),
          });
        } else {
          sendSlack(
            `[daily_conversation] ${subscription.User.name}의 chatId가 없습니다.`
          );
        }
      } catch (error) {
        sendSlack(
          `[Error] Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
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

      try {
        if (subscription.User.chatId) {
          const text = `*${todayWord.korean?.trim()}*\n\[_${todayWord.pronunciation?.trim()}_\]\n${todayWord.description?.trim()}\n\n*Example*\n${todayWord.example_1?.trim()}\n\[_${todayWord.example_2?.trim()}_\]\n${todayWord.example_3?.trim()}\n\n*안녕! Annyeong! 👋🏻*\nSilakan rekam atau ketik balasan Anda sesuai dengan ungkapan dan contoh kalimat hari ini 😊\n\n_Sent from Annyeong WA_`;

          await redis.lpush(
            "telegram_message_queue",
            JSON.stringify({
              chatId: subscription.User.chatId,
              text,
            })
          );

          // 메시지 전송 후 lastWordId 업데이트
          await subscription.update({ lastWordId: todayWord.id });

          // ReceivedWords에 기록 추가
          await db.ReceivedWords.create({
            userId: subscription.userId,
            wordId: todayWord.id,
            receivedDate: new Date(),
          });
        } else {
          sendSlack(
            `[daily_conversation] ${subscription.User.name}의 chatId가 없습니다.`
          );
        }
      } catch (error) {
        sendSlack(
          `[Error] Error sending scheduled message to ${subscription.User.name}: `,
          error
        );
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

cron.schedule("16 15 * * *", async () => {
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

cron.schedule("18 15 * * *", async () => {
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

cron.schedule("20 15 * * *", async () => {
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

module.exports = router;
