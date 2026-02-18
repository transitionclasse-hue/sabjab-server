import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER PREMIUM SMTP (FINAL) =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,               // ✅ Fixed Port for SSL
  secure: true,            // ✅ Must be true for 465
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false // ✅ Fixes SSL Handshake issues
  },
  // ⚡ NETWORK STABILITY
  family: 4,                  // ✅ FORCES IPv4 (Prevents the 30s Hang/Timeout)
  connectionTimeout: 10000,   // ✅ Fail fast if connection is blocked
  greetingTimeout: 5000,
  
  debug: true,                // ✅ Check Render logs for "SMTP Greeting"
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

    // Prevent Duplicate Email for Different Phone Numbers
    const existingUser = await Customer.findOne({ email });
    if (existingUser && existingUser.phone !== phone) {
      return reply.status(400).send({ message: "Email already linked to another number." });
    }

    let customer = await Customer.findOneAndUpdate(
      { phone },
      { 
        email, 
        otp, 
        otpExpires: Date.now() + 300000, 
        role: "Customer" 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Sending professional OTP to ${email}...`);

    // Send Email via Hostinger
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: "SabJab Login Code",
      text: `Your login code is ${otp}. Valid for 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FFB300;">SabJab Verification</h2>
          <p>Use the code below to access your account:</p>
          <h1 style="letter-spacing: 5px; background: #f4f4f4; padding: 15px; display: inline-block;">${otp}</h1>
        </div>
      `
    });

    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Backend Error:", error);
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

// ... Keep existing loginDeliveryPartner, refreshToken, fetchUser
export const loginDeliveryPartner = async (req, reply) => {
    try {
        const { email, password } = req.body;
        const deliveryPartner = await DeliveryPartner.findOne({ email });
        if (!deliveryPartner || password !== deliveryPartner.password) {
            return reply.status(400).send({ message: "Invalid Credentials" });
        }
        const tokens = generateTokens(deliveryPartner);
        return reply.send({ message: "Login Successful", ...tokens, deliveryPartner });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};

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
