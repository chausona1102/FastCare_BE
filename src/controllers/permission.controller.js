const permissionService = require("../services/permission.service");

const promoteToStaff = async (req, res) => {
  try {
    const result = await permissionService.promoteToStaff(req.body["user"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const revokePermission = async (req, res) => {
  try {
    const result = await permissionService.revokePermission(req.body["user"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

module.exports = { promoteToStaff, revokePermission };
