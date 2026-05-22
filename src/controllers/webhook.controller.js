const webhookService = require("../services/webhook.service");

const handleGHNWebhook = async (req, res) => {
  try {
    const { OrderCode, Status } = req.body;
    if (!OrderCode || !Status) {
      return res.status(200).json({ message: "OK" });
    }
    await webhookService.handleGHNOrderStatus({
      orderCode: OrderCode,
      newStatus: Status.toLowerCase(),
    });
    res.status(200).json({ message: "OK" });
  } catch (e) {
    console.error("Webhook error:", e.message);
    res.status(200).json({ message: "OK" }); // luôn trả 200
  }
};

module.exports = { handleGHNWebhook };
