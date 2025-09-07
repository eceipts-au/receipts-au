import rateLimit from "express-rate-limit";

export function withApiKey(req, res, next) {
  const required = process.env.API_KEY;
  if (!required) return next(); // dev mode if no key set
  const got = req.headers["x-api-key"];
  if (got && got === required) return next();
  return res.status(401).json({ error: "unauthorized" });
}

export const limiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
