const cron = require("node-cron");
const { processQueue } = require("./queueProcessor");

// 매 분마다 큐를 확인하여 처리
cron.schedule("* * * * *", () => {
  if (process.env.NODE_ENV === "production") {
    processQueue();
  }
});
