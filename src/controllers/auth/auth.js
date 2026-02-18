import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER PREMIUM SMTP SETUP =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,               // ✅ Implicit SSL
  secure: true,            // ✅ Required for 465
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false // ✅ Bypasses SSL handshake issues
  },
  // ⚡ STABILITY FIXES
  family: 4,                  // ✅ FORCES IPv4 (Prevents the 30s timeout/hang)
  connectionTimeout: 10000,   // ✅ Fail fast (10s) instead of hanging
  greetingTimeout: 5000,
  
  debug: true,                // ✅ Keeps logs active in Render for debugging
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

    if (!phone || !email) {
      return reply.status(400).send({ message: "Phone and Email are required" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 🛡️ PREVENT DUPLICATE KEY ERROR
    // Checks if the email is already used by a different phone number
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ 
        message: "This email is already linked to another phone number." 
      });
    }

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

    console.log(`Attempting to send professional OTP to ${email} via Port 465...`);

    // Send Email via Hostinger
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "SabJab Verification Code",
      text: `Your login code is ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 400px;">
          <h2 style="color: #FFB300;">SabJab Identity</h2>
          <p>Please use the following passcode to access your account:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 12px;">
            <h1 style="letter-spacing: 10px; margin: 0; font-size: 32px;">${otp}</h1>
          </div>
          <p style="font-size: 12px; color: #888; margin-top: 20px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `
    });

    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Backend Auth Error:", error);
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

    // Success - Clear OTP fields and activate user
    customer.otp = undefined;
    customer.otpExpires = undefined;
    customer.isActivated = true;
    await customer.save();

    const tokens = generateTokens(customer);

    return reply.send({
      message: "Login Successful",
      ...tokens,
      customer
    });
  } catch (error) {
    console.error("Verification Error:", error);
    return reply.status(500).send({ message: "Verification failed", error: error.message });
  }
};

/**
 * 3. DELIVERY PARTNER LOGIN
 */
export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;
    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner || password !== deliveryPartner.password) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }

    const tokens = generateTokens(deliveryPartner);

    return reply.send({
      message: "Login Successful",
      ...tokens,
      deliveryPartner,
    });
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};

/**
 * 4. TOKEN REFRESH
 */
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

/**
 * 5. FETCH USER DATA
 */
export const fetchUser = async (req, reply) => {
  try {
    const { userId, role } = req.user;
    const Model = role === "Customer" ? Customer : DeliveryPartner;
    const user = await Model.findById(userId);

    if (!user) return reply.status(404).send({ message: "User not found" });

    return reply.send({ message: "User fetched successfully", user });
  } catch (error) {
    return reply.status(500).send({ message: "Error", error });
  }
};
