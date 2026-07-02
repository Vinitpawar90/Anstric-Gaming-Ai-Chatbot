import { Router } from "express";
import Route from "../../interfaces/route.interface";
import validationMiddleware from "../../middlewares/validation.middleware";
import authMiddleware from "../../middlewares/auth.middleware";
import UserController from "./user.controller";
import { UserDto, UpdateUserDto, LoginDto } from "./user.dto";

class UserRoute implements Route {
  public path = "/users";
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public routes (no auth required)
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(UserDto, "body", false, []),
      this.userController.register
    );

    this.router.post(
      `${this.path}/login`,
      validationMiddleware(LoginDto, "body", false, []),
      this.userController.login
    );

    this.router.post(
      `${this.path}/refresh`,
      this.userController.refresh
    );

    // Protected routes (require auth)
    // IMPORTANT: /me route must come BEFORE /:id to avoid "me" being treated as an ID
    this.router.get(
      `${this.path}/me`,
      authMiddleware,
      this.userController.getCurrentUser
    );

    this.router.post(
      `${this.path}/logout`,
      authMiddleware,
      this.userController.logout
    );

    this.router.get(`${this.path}`, authMiddleware, this.userController.getAllUsers);

    this.router.get(`${this.path}/:id`, authMiddleware, this.userController.getUserById);

    this.router.put(
      `${this.path}/:id`,
      authMiddleware,
      validationMiddleware(UpdateUserDto, "body", true, []),
      this.userController.updateUser
    );

    this.router.delete(`${this.path}/:id`, authMiddleware, this.userController.deleteUser);
  }
}

export default UserRoute;
