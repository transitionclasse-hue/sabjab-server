import { Customer, DeliveryPartner } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// ================= HOSTINGER SMTP SETUP =================
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER, // e.g., help@sabjcom.com
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
 * 1. REQUEST EMAIL OTP
 * Replaces immediate login. Saves email/phone and sends code via register@sabjab.com alias.
 */
export const requestEmailOtp = async (req, reply) => {
    try {
        const { phone, email } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Update/Create customer: links email to phone permanently
        let customer = await Customer.findOneAndUpdate(
            { phone },
            { 
                email, 
                otp, 
                otpExpires: Date.now() + 300000, // 5 minute expiry
                role: "Customer" 
            },
            { upsert: true, new: true }
        );

        // Send Email using your Hostinger alias
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
 * Validates code and issues JWT tokens.
 */
export const verifyOtp = async (req, reply) => {
    try {
        const { phone, otp } = req.body;
        const customer = await Customer.findOne({ phone });

        if (!customer || customer.otp !== otp || customer.otpExpires < Date.now()) {
            return reply.status(400).send({ message: "Invalid or expired OTP" });
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
        return reply.status(500).send({ message: "Verification error", error });
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
