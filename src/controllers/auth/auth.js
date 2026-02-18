import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER VERIFIED SMTP SETUP =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", //
  port: 465,                  //
  secure: true,               //
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4,                  // Forces IPv4 to prevent 30s timeouts
  debug: true,                
  logger: true 
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

/**
 * 1. REQUEST EMAIL OTP
 */
export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) return reply.status(400).send({ message: "Required" });

    // Handle duplicate emails to avoid DuplicateKey crashes
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ message: "This email belongs to another account." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await Customer.findOneAndUpdate(
      { phone },
      { email, otp, otpExpires: Date.now() + 300000, role: "Customer" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "Verification Code",
      text: `Your login code is ${otp}`
    });

    return reply.send({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Auth Error:", error);
    return reply.status(500).send({ message: "Email Failed", error: error.message });
  }
};

/**
 * 2. VERIFY OTP
 */
export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;
    const customer = await Customer.findOne({ phone });
    if (!customer || customer.otp !== otp || customer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "Invalid or expired OTP" });
    }
    customer.otp = undefined;
    customer.otpExpires = undefined;
    customer.isActivated = true;
    await customer.save();
    return reply.send({ message: "Login Successful", ...generateTokens(customer), customer });
  } catch (error) {
    return reply.status(500).send({ message: "Error", error: error.message });
  }
};

/**
 * 3. FETCH USER (CRITICAL FIX FOR DEPLOYMENT)
 */
export const fetchUser = async (req, reply) => {
  try {
    const { userId, role } = req.user;
    const Model = role === "Customer" ? Customer : DeliveryPartner;
    const user = await Model.findById(userId);
    if (!user) return reply.status(404).send({ message: "User not found" });
    return reply.send({ message: "Fetched", user });
  } catch (error) {
    return reply.status(500).send({ message: "Error", error: error.message });
  }
};

/**
 * 4. DELIVERY PARTNER LOGIN
 */
export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });
    if (!deliveryPartner || password !== deliveryPartner.password) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }
    return reply.send({ message: "Login Successful", ...generateTokens(deliveryPartner), deliveryPartner });
  } catch (error) {
    return reply.status(500).send({ message: "Error", error });
  }
};

/**
 * 5. REFRESH TOKEN
 */
export const refreshToken = async (req, reply) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return reply.status(401).send({ message: "Required" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const Model = decoded.role === "Customer" ? Customer : DeliveryPartner;
    const user = await Model.findById(decoded.userId);
    if (!user) return reply.status(403).send({ message: "User not found" });
    return reply.send(generateTokens(user));
  } catch (error) {
    return reply.status(403).send({ message: "Invalid Token" });
  }
};
