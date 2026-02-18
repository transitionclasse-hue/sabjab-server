import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ✅ FIX: SWITCH TO PORT 587 TO STOP TIMEOUTS
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,               // <--- Port 587 is required for Render
  secure: false,           // <--- Must be false for 587
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false // <--- Prevents SSL crashes
  },
  connectionTimeout: 10000, // <--- Stop waiting after 10 seconds
  greetingTimeout: 10000,
  debug: true, 
  logger: true 
});

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ userId: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// 1. REQUEST OTP
export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;
    if (!phone || !email) return reply.status(400).send({ message: "Required" });

    // Handle Duplicate Email Logic
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ message: "Email already linked to another number." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let customer = await Customer.findOneAndUpdate(
      { phone },
      { email, otp, otpExpires: Date.now() + 300000, role: "Customer" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Sending OTP to ${email}...`);

    // Send Email
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "SabJab Login Code",
      text: `Your login code is ${otp}`
    });

    console.log("Email Sent Successfully!");
    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Backend Error:", error);
    return reply.status(500).send({ message: "Email Failed", error: error.message });
  }
};

// 2. VERIFY OTP
export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;
    const customer = await Customer.findOne({ phone });

    if (!customer || customer.otp !== otp || customer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "Invalid or Expired OTP" });
    }

    customer.otp = undefined;
    customer.otpExpires = undefined;
    customer.isActivated = true;
    await customer.save();

    const tokens = generateTokens(customer);
    return reply.send({ message: "Login Successful", ...tokens, customer });
  } catch (error) {
    return reply.status(500).send({ message: "Verification error", error: error.message });
  }
};

// ... (Keep existing loginDeliveryPartner, refreshToken, fetchUser)
export const loginDeliveryPartner = async (req, reply) => { /* Your existing code */ };
export const refreshToken = async (req, reply) => { /* Your existing code */ };
export const fetchUser = async (req, reply) => { /* Your existing code */ };
