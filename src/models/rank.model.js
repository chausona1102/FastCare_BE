const mongoose = require("mongoose");

/*
  black: 10%
  diamond: 7%
  platinum: 5%
  platium: 3%
  silver: 2%
*/

const rankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  rank: {
    type: String,
    enum: ["silver", "gold", "platinum", "diamond", "black"],
    default: "silver",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Rank", rankSchema);
