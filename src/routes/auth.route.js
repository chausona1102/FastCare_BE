const express = require("express");
const router = express.Router();
const {
  login,
  signup,
  verifyEmail,
  resendVerify,
} = require("../controllers/auth.controller");
const upload = require("../middlewares/upload.middleware");
const {
  validateSignup,
  validateLogin,
} = require("../middlewares/validate.middleware");

router.post("/signup", upload.single("avatar"), validateSignup, signup);
router.post("/login", validateLogin, login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verify", resendVerify);

module.exports = router;
