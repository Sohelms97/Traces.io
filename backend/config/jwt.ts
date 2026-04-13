export const jwtConfig = {
  secret: process.env.JWT_SECRET || "your_super_secret_key_here",
  expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "your_refresh_secret",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
};
