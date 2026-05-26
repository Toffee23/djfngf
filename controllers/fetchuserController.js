import { User } from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      age: user.age,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};
