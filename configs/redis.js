import Redis from "ioredis";

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
});

redis.on("connect", () => {
    console.log("Redis Connected");
});

redis.on("error", (err) => {
    console.error("Redis Error:", err.message);
});