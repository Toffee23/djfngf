import { User } from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    // Exclude password and historical logs to keep the payload efficient
    const user = await User.findById(req.user.id).select("-password -defaultPasswordHash");
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Return profile data alongside essential app permission/subscription states
    return res.status(200).json({
      userId: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      age: user.age,
      isProducer: user.isProducer || false,
      isSubscribed: user.isSubscribed || false,
      subscriptionType: user.subscriptionType || "basic",
      hasGameAccess: user.hasGameAccess || false,
      stripeOnboarded: !!user.stripeAccountId, // Returns a clean boolean to check onboarding state
    });
  } catch (err) {
    console.error("Error fetching profile profile state:", err);
    return res.status(500).json({ message: "Server error while fetching profile." });
  }
};