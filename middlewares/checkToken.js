// 미들웨어로 토큰 검사
const checkToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log(req);
  if (authHeader && authHeader === `Bearer ${process.env.SUBSCRIPTION_TOKEN}`) {
    next(); // 토큰이 유효하면 다음 미들웨어 또는 라우트 핸들러로 진행
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = checkToken;
