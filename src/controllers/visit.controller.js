const visitService = require("../services/visit.service");

const createVisited = async (req, res) => {
  try {
    const user = req.user?.id;

    const result = await visitService.createVisited({
      user,
      sessionId: req.body?.sessionId,
      path: req.body?.path,
    });

    res.status(201).json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

module.exports = {
  createVisited,
};
