const chatbotService = require("../services/chatbot.service");

const sendMessage = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const history = req.body?.history;

  if (!message || message.length > 1000) {
    return res.status(400).json({ message: "Tin nhắn phải có từ 1 đến 1000 ký tự." });
  }
  if (
    history !== undefined &&
    (!Array.isArray(history) ||
      history.length > 8 ||
      history.some(
        (item) =>
          !item ||
          !["user", "assistant"].includes(item.role) ||
          typeof item.content !== "string" ||
          !item.content.trim() ||
          item.content.length > 1000
      ))
  ) {
    return res.status(400).json({ message: "Lịch sử hội thoại không hợp lệ." });
  }

  try {
    const result = await chatbotService.createChatReply({
      message,
      history: history || [],
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Chatbot request failed:", error.message);
    return res.status(500).json({ message: "Chatbot gặp lỗi. Vui lòng thử lại sau." });
  }
};

module.exports = { sendMessage };
