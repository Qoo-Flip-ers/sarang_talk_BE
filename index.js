const express = require("express");
const app = express();
const port = 3000;
const { Sequelize } = require("sequelize");
const db = require("./models");
const swaggerDocs = require("./swagger");

const userRouter = require("./routes/user");
const wordRouter = require("./routes/word");
const whatsappRouter = require("./routes/whatsapp");

app.use(express.json());

app.use("/users", userRouter);
app.use("/words", wordRouter);
app.use("/whatsapp", whatsappRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    swaggerDocs(app, port);
  });
});
