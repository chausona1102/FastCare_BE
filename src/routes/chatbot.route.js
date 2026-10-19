const express = require("express");
const { sendMessage } = require("../controllers/chatbot.controller");

const router = express.Router();
const requestsByIp = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

router.post("/", (req, res, next) => {
  const now = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const requestState = requestsByIp.get(clientIp);
  const currentState =
    requestState && now - requestState.startedAt < RATE_LIMIT_WINDOW_MS
      ? requestState
      : { startedAt: now, count: 0 };

  if (currentState.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một phút rồi thử lại.",
    });
  }

  currentState.count += 1;
  requestsByIp.set(clientIp, currentState);
  if (requestsByIp.size > 1000) {
    for (const [ip, state] of requestsByIp) {
      if (now - state.startedAt >= RATE_LIMIT_WINDOW_MS) requestsByIp.delete(ip);
    }
  }

  return next();
}, sendMessage);

module.exports = router;
