const express = require("express");
const router = express.Router();
const { handleGHNWebhook } = require("../controllers/webhook.controller");

router.post("/ghn", handleGHNWebhook);

module.exports = router;
