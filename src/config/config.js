import "dotenv/config";
import fastifySession from "@fastify/session";
import ConnectMongoDBSession from "connect-mongodb-session";
import { Admin } from "../models/index.js";

// Your existing connection variables
export const PORT = process.env.PORT || 5000;
export const COOKIE_PASSWORD = process.env.COOKIE_PASSWORD;
export const MONGO_URI = process.env.MONGO_URI;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// 1. Setting up Session Storage for the Admin Panel
const MongoDBStore = ConnectMongoDBSession(fastifySession);

export const sessionStore = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions"
});

// 2. Logging session errors if any occur
sessionStore.on('error', (error) => {
    console.log("Session store error", error);
});

// 3. Admin Authentication Logic
export const authenticate = async (email, password) => {
    if (email && password) {
        // Look for the admin in the database
        const user = await Admin.findOne({ email });
        
        if (!user) {
            return null; // Admin not found
        }

        // Check if the password matches
        if (user.password === password) {
            return Promise.resolve({ email: email, password: password });
        } else {
            return null; // Wrong password
        }
    }
    return null;
};