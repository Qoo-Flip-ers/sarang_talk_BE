const Redis = require("ioredis");

let redis;

if (process.env.NODE_ENV !== "development") {
  redis = new Redis({
    host: "localhost", // Redis 서버 호스트
    port: 6379, // Redis 서버 포트
  });

  redis.on("connect", () => {
    console.log("Redis에 연결되었습니다");
  });

  redis.on("error", (err) => {
    console.error("Redis 오류:", err);
  });
} else {
  console.log("개발 환경에서는 Redis를 사용하지 않습니다");
  redis = {
    get: () => null,
    set: () => null,
    del: () => null,
    // 필요한 다른 메서드들도 더미 함수로 추가할 수 있습니다
  };
}

module.exports = redis;
