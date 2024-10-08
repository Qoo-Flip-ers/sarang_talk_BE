const db = require("../models");
const TelegramBot = require("node-telegram-bot-api");
const redis = require("../redis");

// 텔레그램 봇 설정
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// /start 명령어 처리
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome! Please enter your code using /code <YOUR_CODE>."
  );
});

// 사용자가 코드를 입력하면 처리
bot.onText(/\/code (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];

  try {
    // 코드 입력 후 안내 메시지
    bot.sendMessage(
      chatId,
      "Kode sedang diverifikasi. Mohon tunggu sebentar. Verifikasi dapat memakan waktu hingga 1 menit."
    );

    // sendSlack(`[텔레그렘 봇] 코드를 입력했습니다. 코드: ${code}`);

    await redis.lpush(
      "request_confirm_code",
      JSON.stringify({
        chatId,
        code,
      })
    );
  } catch (error) {
    console.error("Database error:", error);
    bot.sendMessage(chatId, "Error saving code.");
  }
});

// const sendSlack = async (message) => {
//   try {
//     let text = `${
//       process.env.NODE_ENV === "development" ? "[테스트 환경]" : ""
//     }${message}`;
//     const response = await slack.post(
//       "/T0684TBHDKQ/B07AEG61MR8/GWc1HKf6Bk2U4gIsvfjV2M8I",
//       {
//         text,
//       }
//     );
//   } catch (error) {
//     console.error("Slack 메시지 전송 중 오류 발생:", error);
//   }
// };

module.exports = {
  bot,
};
