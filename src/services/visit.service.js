const Visit = require("../models/visit.model");
const AppError = require("../utils/AppError");

const createVisited = async ({ user, sessionId, path }) => {
  if (
    typeof sessionId !== "string" ||
    !sessionId.trim() ||
    sessionId.length > 128
  ) {
    throw new AppError("Session ID không hợp lệ", 400);
  }
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.length > 2048
  ) {
    throw new AppError("Đường dẫn truy cập không hợp lệ", 400);
  }

  const created = await Visit.create({
    user,
    sessionId: sessionId.trim(),
    path,
  });
  if (!created) throw new Error("Create Failed!");
  return created;
};

module.exports = { createVisited };
