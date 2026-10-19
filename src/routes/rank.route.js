const { getRankByUserId, updateRankByUserId } = require('../controllers/rank.controller');
const express = require('express');
const router = express.Router();
const { verifyToken} = require('../middlewares/auth.middleware');

router.get('/:userId', verifyToken, getRankByUserId);
router.put('/:userId', verifyToken, updateRankByUserId);

module.exports = router;