import { Router } from "express";
import Route from "../../interfaces/route.interface";
import InvitationController from "./invitation.controller";
import validationMiddleware from "../../middlewares/validation.middleware";
import { CreateInvitationDto, ValidateInvitationDto, RegisterWithInvitationDto } from "./invitation.dto";

class InvitationRoute implements Route {
    public path = "/invitations";
    public router = Router();
    public invitationController = new InvitationController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Admin endpoints (require authentication)

        // Create invitation
        this.router.post(
            `${this.path}`,
            validationMiddleware(CreateInvitationDto, "body", false, []),
            this.invitationController.createInvitation
        );

        // Get all pending invitations
        this.router.get(
            `${this.path}`,
            this.invitationController.getPendingInvitations
        );

        // Cancel invitation
        this.router.delete(
            `${this.path}/:id`,
            this.invitationController.cancelInvitation
        );

        // Public endpoints (no authentication required)

        // Validate invitation token
        this.router.get(
            `${this.path}/validate/:token`,
            this.invitationController.validateInvitation
        );

        // Accept invitation and complete registration
        this.router.post(
            `${this.path}/accept`,
            validationMiddleware(RegisterWithInvitationDto, "body", false, []),
            this.invitationController.acceptInvitation
        );
    }
}

export default InvitationRoute;
