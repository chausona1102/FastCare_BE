const userService = require("../services/user.service");

const getUsers = async (req, res) => {
  try {
    const result = await userService.getUsers(
      req.query.limit,
      req.query.search,
      req.query.role
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const result = await userService.changeUserRole(req.params.id, req.body.role);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const softDeleteUser = async (req, res) => {
  try {
    const result = await userService.softDeleteUser(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const toggleLockAccount = async (req, res) => {
  try {
    const result = await userService.toggleLockAccount(req.body["userId"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  changeUserRole,
  softDeleteUser,
  toggleLockAccount,
};
