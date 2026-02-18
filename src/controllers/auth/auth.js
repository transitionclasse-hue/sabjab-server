import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER SMTP SETUP =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // MUST be the full email, e.g., help@sabjcom.com
    pass: process.env.EMAIL_PASS, 
  },
  debug: true, // Shows detailed connection logs in Render
  logger: true // Logs SMTP transaction info
});

// Helper function to generate tokens
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
 * Replaces immediate login. Saves email/phone and sends code via Hostinger.
 */
export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return reply.status(400).send({ message: "Phone and Email are required" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update/Create customer: links email to phone permanently
    // Upsert = true creates a new user if one doesn't exist
    let customer = await Customer.findOneAndUpdate(
      { phone },
      { 
        email, 
        otp, 
        otpExpires: Date.now() + 300000, // 5 minute expiry
        role: "Customer" 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Attempting to send OTP to ${email} via ${process.env.EMAIL_USER}`);

    // Send Email using your Hostinger credentials
    const info = await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, // ✅ FIXED: Must match auth user
      to: email,
      subject: "Your SabJab Verification Code",
      text: `Your login code for SabJab is ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>SabJab Login</h2>
          <p>Your verification code for +91 ${phone} is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
          <p>This code is valid for 5 minutes.</p>
        </div>
      `
    });

    console.log("Email sent successfully:", info.messageId);
    return reply.send({ message: "OTP sent to email successfully" });

  } catch (error) {
    console.error("OTP Request Error (Nodemailer):", error);
    return reply.status(500).send({ 
      message: "Failed to send OTP", 
      error: error.message 
    });
  }
};

/**
 * 2. VERIFY OTP
 * Validates code and issues JWT tokens.
 */
export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;
    
    // Find customer by phone
    const customer = await Customer.findOne({ phone });

    // Check if customer exists and OTP matches
    if (!customer) {
      return reply.status(404).send({ message: "User not found. Please request OTP first." });
    }

    if (!customer.otp || customer.otp !== otp) {
      return reply.status(400).send({ message: "Invalid OTP" });
    }

    if (customer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "OTP has expired. Please request a new one." });
    }

    // Clear sensitive temporary data
    customer.otp = undefined;
    customer.otpExpires = undefined;
    customer.isActivated = true; 
    await customer.save();

    const { accessToken, refreshToken } = generateTokens(customer);

    return reply.send({
      message: "Login Successful",
      accessToken,
      refreshToken,
      customer
    });
  } catch (error) {
    console.error("Verification Error:", error);
    return reply.status(500).send({ message: "Verification error", error: error.message });
  }
};

// ================= DELIVERY PARTNER LOGIN =================
export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner) {
      return reply.status(404).send({ message: "Delivery Partner not found" });
    }

    if (password !== deliveryPartner.password) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(deliveryPartner);

    return reply.send({
      message: "Login Successful",
      accessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};

// ================= TOKEN REFRESH =================
export const refreshToken = async (req, reply) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return reply.status(401).send({ message: "Required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const Model = decoded.role === "Customer" ? Customer : DeliveryPartner;
    const user = await Model.findById(decoded.userId);

    if (!user) return reply.status(403).send({ message: "User not found" });

    const tokens = generateTokens(user);
    return reply.send(tokens);
  } catch (error) {
    return reply.status(403).send({ message: "Invalid Token" });
  }
};

// ================= FETCH USER =================
export const fetchUser = async (req, reply) => {
  try {
    const { userId, role } = req.user;
    const Model = role === "Customer" ? Customer : DeliveryPartner;
    const user = await Model.findById(userId);

    if (!user) return reply.status(404).send({ message: "Not found" });

    return reply.send({ message: "Fetched", user });
  } catch (error) {
    return reply.status(500).send({ message: "Error", error });
  }
};
