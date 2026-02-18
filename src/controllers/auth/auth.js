import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ================= HOSTINGER SMTP SETUP =================
// (Keep your existing transporter settings here)
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  debug: true, 
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
 * 1. REQUEST EMAIL OTP (FIXED FOR DUPLICATE EMAIL ERROR)
 */
export const requestEmailOtp = async (req, reply) => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      return reply.status(400).send({ message: "Phone and Email are required" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 1. Check if this EMAIL is already used by ANOTHER phone number
    const existingUserByEmail = await Customer.findOne({ email });
    
    if (existingUserByEmail && existingUserByEmail.phone !== phone) {
      // SCENARIO: Email exists, but for a different phone number.
      // ACTION: We cannot allow this if emails must be unique.
      return reply.status(400).send({ 
        message: "This email is already linked to another phone number. Please use a different email." 
      });
    }

    // 2. Safe Update/Create
    // Since we passed the check above, we know:
    // - Either the email doesn't exist (New User)
    // - OR the email exists but belongs to THIS phone number (Existing User login)
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

    console.log(`Sending OTP ${otp} to ${email}...`);

    // 3. Send Email
    await transporter.sendMail({
      from: `"SabJab Secure" <${process.env.EMAIL_USER}>`, 
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

    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Backend OTP Error:", error);
    
    // Explicitly catch duplicate key errors to give a better message
    if (error.code === 11000) {
       return reply.status(400).send({ message: "This email is already registered with another account." });
    }

    return reply.status(500).send({ message: "Failed to send OTP", error: error.message });
  }
};

// ... (Rest of your verifyOtp and other functions remain exactly the same)
export const verifyOtp = async (req, reply) => {
    // ... [Use your existing verifyOtp code]
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

// ... [Keep other exports: loginDeliveryPartner, refreshToken, fetchUser]
export const loginDeliveryPartner = async (req, reply) => { /* ... */ };
export const refreshToken = async (req, reply) => { /* ... */ };
export const fetchUser = async (req, reply) => { /* ... */ };
