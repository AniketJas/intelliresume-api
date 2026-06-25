import bcrypt from "bcryptjs";

import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: 0, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();

    return res.status(201).json({ success: 1, message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ success: 0, message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: 0,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: 0,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      success: 1,
      message: "Login successful",
      token, // Optional: remove if using only cookies
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: 0,
      message: "Server error",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    // In a real application, you would handle token invalidation or session destruction here.
    res.clearCookie("token");
    return res.status(200).json({ success: 1, message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ success: 0, message: "Server error", error: error.message });
  }
};