const db = require("../models");
const redis = require("../redis");
const retry = require("async-retry");
const slack = require("axios").create({
  baseURL: "https://hooks.slack.com/services",
});
const { bot } = require("./telegramBot");

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

// 서버리스 DB에 데이터 삽입 함수 (Sequelize 사용)
async function insertIntoDatabase(data) {
  const {
    name,
    phoneNumber,
    email,
    startDate,
    endDate,
    type,
    plan,
    quiz,
    zoom,
    code,
    codeGeneratedAt,
  } = data;

  try {
    let user = await db.User.findOne({ where: { phoneNumber, email } });

    if (!user) {
      user = await db.User.create({
        name,
        phoneNumber,
        email,
        status: "active",
        code,
        codeGeneratedAt,
      });
    }

    type.forEach(async (t) => {
      let newQuiz;
      let newZoom;
      if (quiz && Array.isArray(quiz)) {
        quiz.includes(t + "_quiz") && (newQuiz = t + "_quiz");
      }
      if (zoom && Array.isArray(zoom)) {
        newZoom = zoom.join(",");
      }

      const newSubscription = await db.Subscription.create({
        userId: user.id,
        type: t,
        subscriptionDate: startDate,
        expirationDate: endDate,
        plan,
        quiz: newQuiz,
        zoom: newZoom,
      });
    });

    // twilio 시작 안내 메세지 발송 필요

    // 시작 안내 메세지 발송
    sendSlack(
      `[등록완료] 새로운 사용자 등록이 완료되었습니다: ${user.name} (${user.phoneNumber}) ${type}`
    );
  } catch (error) {
    sendSlack(
      `[등록에러] 새로운 사용자 등록 중에 에러가 발생했습니다: ${user.name} (${user.phoneNumber}) ${type}`
    );
  }
}

// 현재 작업이 실행 중인지 확인하는 플래그 변수
let isProcessingQueue = false;

// 큐에서 요청을 가져와 처리하는 함수
async function processQueue() {
  if (isProcessingQueue) {
    console.log("Queue processing is already in progress. Skipping this run.");
    return;
  }

  isProcessingQueue = true;

  try {
    const data = await redis.rpop("request_subscription");

    if (data) {
      const requestData = JSON.parse(data);
      console.log("Processing request:", requestData);

      await retry(
        async (bail) => {
          try {
            await insertIntoDatabase(requestData);
          } catch (err) {
            console.error("Error inserting into database:", err);
            throw err;
          }
        },
        {
          retries: 10,
          minTimeout: 70000,
          onRetry: (err, attempt) => {
            console.error(`Attempt ${attempt} failed:`, err);
            sendSlack(`[DB 에러] DB 잠자는 중. ${err.message}`);
          },
        }
      );

      console.log("Request processed successfully");
    }
  } catch (err) {
    console.error("Error processing queue:", err);
  } finally {
    isProcessingQueue = false;
  }
}

const checkUserCodeForTelegram = async (data) => {
  const { chatId, code } = data;

  try {
    let user = await db.User.findOne({ where: { code } });

    if (!user) {
      sendSlack(`[텔레그램 봇] 코드가 일치하지 않습니다. 코드: ${code}`);
      // await bot.sendMessage(chatId, "Code does not match.");
      return;
    }

    user.chatId = chatId;
    await user.save();

    await bot.sendMessage(
      chatId,
      "Pendaftaran berhasil! Mulai besok, Anda akan menerima kata dalam Bahasa Korea setiap hari pukul 9 pagi. Terima kasih."
    );

    // 시작 안내 메세지 발송
    sendSlack(
      `[등록완료] 텔레그렘에 새로운 사용자 등록이 완료되었습니다: ${user.name} (${user.phoneNumber})`
    );
  } catch (error) {
    sendSlack(
      `[등록에러] 텔레그렘 새로운 사용자 등록 중에 에러가 발생했습니다: ${user.name} (${user.phoneNumber})`
    );
  }
};

let isProcessingQueueForTelegramBot = false;

const processQueueForTelegramBot = async () => {
  if (isProcessingQueueForTelegramBot) {
    console.log("Queue processing is already in progress. Skipping this run.");
    return;
  }

  isProcessingQueueForTelegramBot = true;

  try {
    const data = await redis.rpop("request_confirm_code");

    if (data) {
      const requestData = JSON.parse(data);
      console.log("Processing request:", requestData);

      await retry(
        async (bail) => {
          try {
            await checkUserCodeForTelegram(requestData);
          } catch (err) {
            console.error("Error inserting into database:", err);
            throw err;
          }
        },
        {
          retries: 10,
          minTimeout: 70000,
          onRetry: (err, attempt) => {
            console.error(`Attempt ${attempt} failed:`, err);
            sendSlack(
              `[DB 에러] DB 잠자는 중. telegram cron job 시도중. ${err.message}`
            );
          },
        }
      );

      console.log("Request processed successfully");
    }
  } catch (err) {
    console.error("Error processing queue:", err);
  } finally {
    isProcessingQueueForTelegramBot = false;
  }
};

module.exports = {
  processQueue,
  processQueueForTelegramBot,
};
