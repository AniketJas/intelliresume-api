import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../configs/redis.js";

export const rateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,

    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes.",
    },

    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Rate limit exceeded. Please try again later.",
        });
    },
});