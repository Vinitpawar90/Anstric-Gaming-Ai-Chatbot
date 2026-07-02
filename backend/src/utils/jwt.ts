import jwt from "jsonwebtoken";
import HttpException from "../exceptions/HttpException";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set!");
}

/**
 * Generate access token (short-lived - 15 minutes)
 */
export const generateAccessToken = (payload: object, expiresIn: string | number = "15m") => {
  try {
    if (!JWT_SECRET) {
      throw new HttpException(500, "JWT secret is not configured");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  } catch (error: any) {
    throw new HttpException(500, `Error generating access token: ${error.message}`);
  }
};

/**
 * Generate refresh token (long-lived - 7 days)
 */
export const generateRefreshToken = (payload: object, expiresIn: string | number = "7d") => {
  try {
    if (!JWT_REFRESH_SECRET) {
      throw new HttpException(500, "JWT refresh secret is not configured");
    }
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: expiresIn as any });
  } catch (error: any) {
    throw new HttpException(500, `Error generating refresh token: ${error.message}`);
  }
};

/**
 * Legacy function - generates access token for backward compatibility
 */
export const generateToken = (payload: object, expiresIn: string | number = "15m") => {
  return generateAccessToken(payload, expiresIn);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string) => {
  try {
    if (!JWT_SECRET) {
      throw new HttpException(500, "JWT secret is not configured");
    }
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new HttpException(401, "Access token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new HttpException(401, "Invalid access token");
    }
    throw new HttpException(500, `Access token verification error: ${error.message}`);
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string) => {
  try {
    if (!JWT_REFRESH_SECRET) {
      throw new HttpException(500, "JWT refresh secret is not configured");
    }
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new HttpException(401, "Refresh token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new HttpException(401, "Invalid refresh token");
    }
    throw new HttpException(500, `Refresh token verification error: ${error.message}`);
  }
};

/**
 * Legacy function - verifies access token for backward compatibility
 */
export const verifyToken = (token: string) => {
  return verifyAccessToken(token);
};
