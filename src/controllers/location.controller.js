const locationService = require("../services/location.service");

const createLocation = async (req, res) => {
  try {
    const result = await locationService.createLocation({
      ...req.body,
      user: req.user.id,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllLocation = async (req, res) => {
  try {
    const result = await locationService.getAllLocation();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getLocationById = async (req, res) => {
  try {
    const result = await locationService.getLocationById(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getLocationDefaultOfUser = async (req, res) => {
  try {
    const result = await locationService.getLocationDefaultOfUser(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getLocationByUser = async (req, res) => {
  try {
    const result = await locationService.getLocationByUser(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const result = await locationService.updateLocation(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const result = await locationService.deleteLocation(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createLocation,
  getAllLocation,
  getLocationById,
  getLocationDefaultOfUser,
  getLocationByUser,
  updateLocation,
  deleteLocation,
};
