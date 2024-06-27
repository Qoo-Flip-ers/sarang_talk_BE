const express = require("express");
const router = express.Router();
const db = require("../models");
const axios = require("axios");
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");

// Discord client 설정
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

discordClient.once("ready", async () => {
  console.log("Discord bot is ready!");
  try {
    const channel = await discordClient.channels.fetch(
      process.env.DISCORD_CHANNEL_ID
    );
    if (channel) {
      console.log(`Bot has access to channel: ${channel.name}`);
    } else {
      console.error(
        `Bot does not have access to channel with ID: ${process.env.DISCORD_CHANNEL_ID}`
      );
    }
  } catch (error) {
    console.error("Error fetching channel:", error);
  }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
/**
 * @swagger
 * /webhook/whatsapp:
 *   post:
 *     summary: WhatsApp 메시지를 Discord로 전송
 *     description: WhatsApp에서 받은 메시지를 Discord 채널로 전송합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: WhatsApp에서 받은 메시지
 *                 example: "안녕하세요, 이 메시지는 WhatsApp에서 보낸 메시지입니다."
 *     responses:
 *       200:
 *         description: 메시지가 성공적으로 Discord로 전송되었습니다.
 *       404:
 *         description: 지정된 Discord 채널을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 */
router.post("/whatsapp", async (req, res) => {
  // Discord 채널로 메시지 전송
  // Discord 채널로 메시지 전송
  const channel = await discordClient.channels.fetch(
    process.env.DISCORD_CHANNEL_ID
  );
  if (channel) {
    // 봇의 권한을 확인
    const botMember = await channel.guild.members.fetch(discordClient.user.id);
    if (
      botMember
        .permissionsIn(channel)
        .has(PermissionsBitField.Flags.SendMessages)
    ) {
      channel.send("테스트 메세지 입니다");
    } else {
      console.error(
        "Bot does not have permission to send messages in this channel."
      );
    }
  } else {
    console.error(
      `Bot does not have access to channel with ID: ${process.env.DISCORD_CHANNEL_ID}`
    );
  }
  return;

  //---------------------

  try {
    const message = req.body;

    // 메시지가 있는지 확인
    if (
      message &&
      message.messages &&
      message.messages[0] &&
      message.messages[0].text
    ) {
      const text = message.messages[0].text.body;

      // Discord 채널로 메시지 전송
      const channel = await discordClient.channels.fetch(
        process.env.DISCORD_CHANNEL_ID
      );
      if (channel) {
        channel.send(`New message from WhatsApp: ${text}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
