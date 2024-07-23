const cron = require("node-cron");
const {
  processQueue,
  processQueueForTelegramBot,
} = require("./queueProcessor");

// 매 분마다 큐를 확인하여 처리
cron.schedule("* * * * *", async () => {
  if (process.env.NODE_ENV === "production") {
    await processQueue();
    await processQueueForTelegramBot();
  }
});
