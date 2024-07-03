const cron = require("node-cron");
const axios = require("axios");

// 서버 시간이 몇시 기준으로 돼있는지 테스트하는 코드
cron.schedule("* * * * *", () => {
  const now = new Date();
  console.log(`현재 서버 시간: ${now.toISOString()}`);
});

// 매일 한국 시간 오후 4시 5분에 작동하는 cron 작업을 설정합니다.
// 한국 시간은 UTC+9이므로, UTC 시간으로는 오전 7시 5분입니다.
cron.schedule("5 7 * * *", async () => {
  try {
    console.log("매일 오전 0시 5분에 작동하는 작업 시작");

    const now = new Date();
    const sendAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 5, 0, 0)); // 한국 시간 0시 5분은 UTC로 당일 15시 5분
    console.log(`API 전달값: ${sendAt.toISOString()}`);
    // 예를 들어, 특정 API를 호출하는 경우:
    // const response = await axios.get("https://example.com/api/daily-task", { params: { sendAt } });
    // console.log("API 호출 결과:", response.data);

    console.log("작업이 성공적으로 완료되었습니다.");
  } catch (error) {
    console.error("작업 중 오류 발생:", error);
  }
});
