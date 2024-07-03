const cron = require("node-cron");
const axios = require("axios");

// 매일 한국 시간 오후 4시에 작동하는 cron 작업을 설정합니다.
// 한국 시간은 UTC+9이므로, UTC 시간으로는 오전 7시입니다.
cron.schedule("0 7 * * *", async () => {
  try {
    console.log("매일 오후 4시에 작동하는 작업 시작");

    // 여기에 실행할 로직을 추가합니다.
    // 예를 들어, 특정 API를 호출하는 경우:
    // const response = await axios.get("https://example.com/api/daily-task");
    // console.log("API 호출 결과:", response.data);

    console.log("작업이 성공적으로 완료되었습니다.");
  } catch (error) {
    console.error("작업 중 오류 발생:", error);
  }
});
