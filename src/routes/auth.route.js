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
  requestPasswordReset,
  verifyPasswordResetPin,
  resetPassword,
  refresh,
  logout,
  getMe,
  getActiveRefreshTokens,
  revokeRefreshToken,
  revokeLoginSession,
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
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-password-reset-pin", verifyPasswordResetPin);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.get("/sessions", verifyToken, verifyAdmin, getActiveRefreshTokens);
router.delete("/sessions/:id", verifyToken, verifyAdmin, revokeRefreshToken);
router.post("/sessions/:id/revoke-from-email", revokeLoginSession);

module.exports = router;
