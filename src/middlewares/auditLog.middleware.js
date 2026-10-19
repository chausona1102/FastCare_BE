const Log = require("../models/log.model");

const getTargetId = (req, responseBody) =>
  req.params.id ||
  req.body.userId ||
  responseBody?._id ||
  responseBody?.order?._id ||
  responseBody?.user?._id ||
  null;

const auditLog = ({ action, target }) => (req, res, next) => {
  const sendJson = res.json.bind(res);

  res.json = (responseBody) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return sendJson(responseBody);
    }

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      console.error(`Cannot record audit log "${action}": authenticated user is missing.`);
      res.statusCode = 500;
      return sendJson({
        message: "Thao tác đã hoàn tất nhưng không thể xác định người thực hiện để lưu log.",
      });
    }

    return Log.create({
      user: userId,
      action,
      target,
      targetId: getTargetId(req, responseBody),
    })
      .then(() => sendJson(responseBody))
      .catch((error) => {
        console.error(`Audit log failed after "${action}" completed:`, error);
        res.statusCode = 500;
        return sendJson({
          message: "Thao tác đã hoàn tất nhưng không thể lưu log. Vui lòng liên hệ quản trị viên.",
        });
      });
  };

  next();
};

module.exports = auditLog;
