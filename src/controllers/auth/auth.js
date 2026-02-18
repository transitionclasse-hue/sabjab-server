import { Customer, DeliveryPartner } from '../../models/user.js'; // Adjust .. depending on folder depth
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER SMTP CONFIGURATION =================
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER, // MUST be the same email used in 'from' field
    pass: process.env.EMAIL_PASS, 
  },
  debug: true, // Enable debug logs for Render
  logger: true 
});

// Helper: Generate JWTs
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
 * Saves phone/email to DB and sends OTP via Hostinger SMTP.
 */
export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return reply.status(400).send({ message: "Phone and Email are required" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save/Update User
    let customer = await Customer.findOneAndUpdate(
      { phone },
      { 
        email, 
        otp, 
        otpExpires: Date.now() + 300000, // 5 mins
        role: "Customer" 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Sending OTP ${otp} to ${email} from ${process.env.EMAIL_USER}...`);

    // Send Email
    const info = await transporter.sendMail({
      from: `"SabJab Security" <${process.env.EMAIL_USER}>`, // ✅ CRITICAL: Must match auth user
      to: email,
      subject: "SabJab Login Verification",
      text: `Your login code is ${otp}. Valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FFB300;">SabJab Login</h2>
          <p>Please use the following One Time Password (OTP) to login:</p>
          <h1 style="letter-spacing: 5px; background: #eee; padding: 10px; display: inline-block;">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `
    });

    console.log("Email sent: %s", info.messageId);
    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("OTP Email Error:", error);
    return reply.status(500).send({ message: "Failed to send OTP", error: error.message });
  }
};

/**
 * 2. VERIFY OTP
 * Checks OTP and issues Tokens.
 */
export const verifyOtp = async (req, reply) => {
  try {
    const { phone, otp } = req.body;
    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return reply.status(404).send({ message: "User not found. Request OTP first." });
    }

    if (!customer.otp || customer.otp !== otp) {
      return reply.status(400).send({ message: "Invalid OTP" });
    }

    if (customer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "OTP Expired" });
    }

    // Success - Clear OTP fields
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
    console.error("Verify Error:", error);
    return reply.status(500).send({ message: "Verification failed", error: error.message });
  }
};

// ... (Rest of your Delivery Partner / Refresh Token logic remains the same)
// Use the previous logic for loginDeliveryPartner, refreshToken, fetchUser
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

export const refreshToken = async (req, reply) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return reply.status(401).send({ message: "Access Denied. No refresh token provided." });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const Model = decoded.role === "Customer" ? Customer : DeliveryPartner;
        const user = await Model.findById(decoded.userId);

        if (!user) return reply.status(403).send({ message: "User not found" });

        const tokens = generateTokens(user);
        return reply.send(tokens);
    } catch (error) {
        return reply.status(403).send({ message: "Invalid Refresh Token" });
    }
};

export const fetchUser = async (req, reply) => {
    try {
        const { userId, role } = req.user;
        const Model = role === "Customer" ? Customer : DeliveryPartner;
        const user = await Model.findById(userId);

        if (!user) {
            return reply.status(404).send({ message: "User not found" });
        }

        return reply.send({ message: "User fetched successfully", user });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};
