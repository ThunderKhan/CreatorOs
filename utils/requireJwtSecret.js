function requireJwtSecret(env = process.env) {
  if (env.NODE_ENV === "production" && !env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return env.JWT_SECRET;
}

module.exports = requireJwtSecret;
