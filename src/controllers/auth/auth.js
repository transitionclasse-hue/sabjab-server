import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// ================= HOSTINGER SMTP SETUP =================
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER, // help@sabjcom.com
        pass: process.env.EMAIL_PASS, 
    },
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
 * 1. REQUEST OTP (Email Fallback)
 * This replaces your immediate login. It saves the phone/email and sends the code.
 */
export const requestEmailOtp = async (req, reply) => {
    try {
        const { phone, email } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Update or Create customer and save OTP/Email
        let customer = await Customer.findOneAndUpdate(
            { phone },
            { 
                email, 
                otp, 
                otpExpires: Date.now() + 300000, // 5 minutes
                role: "Customer" 
            },
            { upsert: true, new: true }
        );

        // Send Email via Hostinger alias
        await transporter.sendMail({
            from: '"Sabjab Registration" <register@sabjab.com>',
            to: email,
            subject: "Your Sabjab Login Code",
            text: `Your login code for +91 ${phone} is ${otp}.`,
        });

        return reply.send({ message: "OTP sent to email successfully" });
    } catch (error) {
        console.error("OTP Request Error:", error);
        return reply.status(500).send({ message: "Failed to send OTP", error });
    }
};

/**
 * 2. VERIFY OTP
 * This checks the code and finally logs the user in.
 */
export const verifyOtp = async (req, reply) => {
    try {
        const { phone, otp } = req.body;
        const customer = await Customer.findOne({ phone });

        if (!customer || customer.otp !== otp || customer.otpExpires < Date.now()) {
            return reply.status(400).send({ message: "Invalid or expired OTP" });
        }

        // Clear OTP and activate user
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
        return reply.status(500).send({ message: "Verification error", error });
    }
};

// --- KEEP YOUR EXISTING loginDeliveryPartner, refreshToken, and fetchUser FUNCTIONS BELOW ---
