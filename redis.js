const Redis = require("ioredis");

const redis = new Redis({
  host: "localhost", // Redis 서버 호스트
  port: 6379, // Redis 서버 포트
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = redis;
