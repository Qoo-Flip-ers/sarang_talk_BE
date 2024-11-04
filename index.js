require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const { Sequelize } = require("sequelize");
const db = require("./models");
const swaggerDocs = require("./swagger");
const cors = require("cors");
require("./services/cronJobs"); // Cron 작업을 초기화합니다.
require("./redis"); // Redis 서버에 연결합니다.
require("./services/telegramBot"); // 텔레그램 봇을 초기화합니다.

const userRouter = require("./routes/user");
const wordRouter = require("./routes/word");
const questionRouter = require("./routes/question");
const whatsappRouter = require("./routes/whatsapp");
const telegramRouter = require("./routes/telegram");
const webhookRouter = require("./routes/webhook");
const subscriptionRouter = require("./routes/subscription");
const bubbleSubscriptionRouter = require("./routes/bubble-subscription");
const authRouter = require("./routes/auth");
const generateRouter = require("./routes/generate");
const uploadRouter = require("./routes/upload");

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);
app.use("/words", wordRouter);
app.use("/questions", questionRouter);
app.use("/whatsapp", whatsappRouter);
app.use("/telegram", telegramRouter);
app.use("/webhook", webhookRouter);
app.use("/subscription", subscriptionRouter);
app.use("/subscription/bubble", bubbleSubscriptionRouter);
app.use("/auth", authRouter);
app.use("/generate", generateRouter);
app.use("/upload", uploadRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

db.sequelize.sync().then(() => {
  console.log("데이터베이스 연결 성공");
});

const server = app.listen(port, (req) => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
  setTimeout(() => {
    swaggerDocs(app, port);
  }, 1000);

  console.log(req);
  if (process.send) {
    process.send("ready");
  }
});

// pm2로부터 종료 신호(SIGINT)를 받으면 서버를 안전하게 종료합니다.
process.on("SIGINT", async () => {
  console.log("서버를 종료합니다.");
  server.close();
  console.log("Express 앱이 성공적으로 종료되었습니다.");
  process.exit(0);
});
