import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/* =====================================================
   TOKEN GENERATION
===================================================== */

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

/* =====================================================
   REQUEST OTP
===================================================== */

export const requestEmailOtp = async (req, reply) => {
  try {

    // ⭐ FIXED (normalize types)
    const phone = Number(req.body.phone);
    const email = String(req.body.email).trim().toLowerCase();

    if (!phone || !email) {
      return reply.status(400).send({
        message: "Phone and email required"
      });
    }

    /* ---------- CHECK DUPLICATE EMAIL ---------- */
    const existingUser = await Customer.findOne({ email });

    // ⭐ FIXED COMPARISON
    if (
      existingUser &&
      Number(existingUser.phone) !== Number(phone)
    ) {
      return reply.status(400).send({
        message: "Email already linked to another number."
      });
    }

    /* ---------- GENERATE OTP ---------- */
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    /* ---------- SAVE OTP IN DATABASE ---------- */
    await Customer.findOneAndUpdate(
      { phone },
      {
        email,
        otp,
        otpExpires: Date.now() + 300000,
        role: "Customer",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ OTP saved in DB");

    /* =====================================================
       SEND OTP VIA HOSTINGER MAIL API
    ===================================================== */

    try {
      const response = await fetch("https://sabjab.com/send-otp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp }),
      });

      const raw = await response.text();
      console.log("📩 Mail API response:", raw);

      let result;
      try {
        result = JSON.parse(raw);
      } catch (err) {
        console.error("❌ Invalid JSON from mail API");
        result = { success: false };
      }

      if (!result.success) {
        console.error("⚠️ Email send failed");
      } else {
        console.log("✅ OTP email sent");
      }

    } catch (mailError) {
      console.error("⚠️ Mail API error:", mailError.message);
      // do not fail OTP flow
    }

    return reply.send({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("❌ OTP ERROR:", error);
    return reply.status(500).send({
      message: "Error",
      error: error.message
    });
  }
};

/* =====================================================
   VERIFY OTP
===================================================== */

export const verifyOtp = async (req, reply) => {
  try {

    // ⭐ ensure same type
    const phone = Number(req.body.phone);
    const { otp } = req.body;

    const customer = await Customer.findOne({ phone });

    if (
      !customer ||
      customer.otp !== otp ||
      customer.otpExpires < Date.now()
    ) {
      return reply.status(400).send({
        message: "Invalid or expired OTP"
      });
    }

    customer.otp = undefined;
    customer.isActivated = true;
    await customer.save();

    return reply.send({
      message: "Login Successful",
      ...generateTokens(customer),
      customer
    });

  } catch (error) {
    return reply.status(500).send({ message: "Error" });
  }
};

/* =====================================================
   REQUIRED EXPORTS
===================================================== */

export const fetchUser = async (req, reply) => {
  try {
    const user =
      (await Customer.findById(req.user.userId)) ||
      (await DeliveryPartner.findById(req.user.userId));

    return reply.send({ user });

  } catch (error) {
    return reply.status(500).send({ message: "Error" });
  }
};

export const loginDeliveryPartner = async (req, reply) => { /* logic */ };
export const refreshToken = async (req, reply) => { /* logic */ };
