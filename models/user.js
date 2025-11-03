import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  facebookId: String,
  businessType: String,
  city: String,
  mainChallenge: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
