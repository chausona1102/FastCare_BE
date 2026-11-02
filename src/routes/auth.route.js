const express = require("express");
const {
  authenticate,
  verifyToken,
  verifyAdmin,
} = require("../middlewares/auth.middleware");
const router = express.Router();
const {
  login,
  signup,
  verifyEmail,
  resendVerify,
  refresh,
  logout,
  getMe,
  getActiveRefreshTokens,
  revokeRefreshToken,
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
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.get("/sessions", verifyToken, verifyAdmin, getActiveRefreshTokens);
router.delete("/sessions/:id", verifyToken, verifyAdmin, revokeRefreshToken);

module.exports = router;
