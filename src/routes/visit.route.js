const express = require("express");
const router = express.Router();
const { createVisited } = require("../controllers/visit.controller");
const { optionalAuthenticate } = require("../middlewares/auth.middleware");

router.post("/", optionalAuthenticate, createVisited);

module.exports = router;
