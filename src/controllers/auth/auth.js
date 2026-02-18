import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER VERIFIED SMTP SETUP =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // ✅ From Hostinger Screenshot
  port: 465,                  // ✅ From Hostinger Screenshot
  secure: true,               // ✅ Required for 465
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false 
  },
  family: 4,                  // ✅ Forces IPv4 to stop the 30s timeout hang
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

    // 🛡️ Fix for "DuplicateKey" error found in your logs
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ message: "This email belongs to another account." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let customer = await Customer.findOneAndUpdate(
      { phone },
      { email, otp, otpExpires: Date.now() + 300000, role: "Customer" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send Professional Email
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "SabJab Login Code",
      text: `Your login code is ${otp}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FFB300;">SabJab Authentication</h2>
          <p>Your one-time passcode is:</p>
          <h1 style="letter-spacing: 5px; background: #eee; padding: 10px; display: inline-block;">${otp}</h1>
        </div>`
    });

    return reply.send({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("SMTP Error:", error);
    return reply.status(500).send({ message: "Email Failed", error: error.message });
  }
};

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
    return reply.status(500).send({ message: "Verification failed", error: error.message });
  }
};

// ... Include loginDeliveryPartner, refreshToken, and fetchUser as before
