const router = require("express").Router();
const { getLogs } = require("../controllers/log.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, verifyAdmin, getLogs);

module.exports = router;
