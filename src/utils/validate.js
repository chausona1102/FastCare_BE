const mongoose = require("mongoose");

const checkObjectID = (id, log) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(log);
};

module.exports = { checkObjectID };
