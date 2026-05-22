const userService = require("../services/user.service");

const toggleLockAccount = async (req, res) => {
  try {
    const result = await userService.toggleLockAccount(req.body["userId"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

module.exports = { toggleLockAccount };
