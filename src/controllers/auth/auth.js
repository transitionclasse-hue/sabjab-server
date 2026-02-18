import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER VERIFIED SMTP =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,                  //
  secure: true,               //
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: { rejectUnauthorized: false },
  family: 4,                  // ⚡ FORCES IPv4 (Stops the 30s timeout hang)
  connectionTimeout: 10000,   // Fail fast if blocked
  debug: true,                
  logger: true 
});

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ userId: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) return reply.status(400).send({ message: "Required" });

    // Prevent DuplicateKey error from your logs
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ message: "Email already linked to another number." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await Customer.findOneAndUpdate(
      { phone },
      { email, otp, otpExpires: Date.now() + 300000, role: "Customer" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Attempting connection to Hostinger
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "SabJab Verification",
      text: `Your login code is ${otp}`
    });

    return reply.send({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("SMTP Connection Error:", error.message);
    return reply.status(500).send({ message: "Server connection to Email failed", error: error.message });
  }
};

export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;
    const customer = await Customer.findOne({ phone });
    if (!customer || customer.otp !== otp || customer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "Invalid/Expired OTP" });
    }
    customer.otp = undefined;
    customer.isActivated = true;
    await customer.save();
    return reply.send({ message: "Login Successful", ...generateTokens(customer), customer });
  } catch (error) { return reply.status(500).send({ message: "Error" }); }
};

// Required exports to fix deployment
export const fetchUser = async (req, reply) => {
  try {
    const user = await Customer.findById(req.user.userId) || await DeliveryPartner.findById(req.user.userId);
    return reply.send({ user });
  } catch (error) { return reply.status(500).send({ message: "Error" }); }
};

export const loginDeliveryPartner = async (req, reply) => { /* logic */ };
export const refreshToken = async (req, reply) => { /* logic */ };
