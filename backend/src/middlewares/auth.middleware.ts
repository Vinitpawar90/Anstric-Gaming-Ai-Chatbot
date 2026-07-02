import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import HttpException from "../exceptions/HttpException";
import {
  DataStoredInToken,
  RequestWithUser,
} from "../interfaces/auth.interface";

// Routes that don't require authentication
const EXEMPT_ROUTES = [
  "/users/register",
  "/users/login",
  "/users/refresh",
  "/health",
  "/invitations/validate",
  "/invitations/accept",
];

// Helper function to check if route is exempt from authentication
const isExemptRoute = (path: string): boolean => {
  return EXEMPT_ROUTES.some(route => path.includes(route));
};

const authMiddleware = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if the current route is exempt from authentication
    if (isExemptRoute(req.path)) {
      return next();
    }

    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return next(new HttpException(401, "Authentication token missing"));
    }

    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.split(" ")[1];

    if (!token || token === "null") {
      return next(new HttpException(401, "Invalid authentication token"));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new HttpException(500, "JWT secret not configured"));
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as DataStoredInToken;

    // Attach user ID to request for use in controllers
    req.userId = decoded.id;
    next();
  } catch (error) {
    // Provide specific error messages based on JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      next(new HttpException(401, "Authentication token expired"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new HttpException(401, "Invalid authentication token"));
    } else {
      next(new HttpException(401, "Authentication failed"));
    }
  }
};

export default authMiddleware;
