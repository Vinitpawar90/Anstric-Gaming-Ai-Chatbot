import { NextFunction, Request, Response } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import InvitationService from "./invitation.service";
import { CreateInvitationDto, ValidateInvitationDto, RegisterWithInvitationDto } from "./invitation.dto";
import HttpException from "../../exceptions/HttpException";
import ResponseUtil from "../../utils/response.util";

class InvitationController {
    public invitationService = new InvitationService();

    /**
     * Create a new invitation (Admin only)
     */
    public createInvitation = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            // TODO: Add admin role check
            // For now, any authenticated user can create invitations

            const data: CreateInvitationDto = req.body;
            const invitation = await this.invitationService.createInvitation(data, userId);

            // Generate invitation link
            const invitationLink = this.invitationService.getInvitationLink(
                invitation.invitation_token,
                req.body.frontend_url
            );

            res.status(201).json(
                ResponseUtil.created("Invitation created successfully", {
                    ...invitation,
                    invitation_link: invitationLink,
                })
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all pending invitations (Admin only)
     */
    public getPendingInvitations = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            // TODO: Add admin role check

            const invitations = await this.invitationService.getPendingInvitations();

            res.status(200).json(
                ResponseUtil.success("Pending invitations retrieved successfully", invitations)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Validate an invitation token (Public endpoint)
     */
    public validateInvitation = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { token } = req.params;

            const validation = await this.invitationService.validateInvitationToken(token);

            if (validation.valid) {
                res.status(200).json(
                    ResponseUtil.success("Invitation is valid", {
                        email: validation.invitation?.email,
                        role: validation.invitation?.role,
                        expires: validation.invitation?.invitation_expires,
                    })
                );
            } else {
                res.status(400).json(
                    ResponseUtil.error(validation.error || "Invalid invitation")
                );
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Accept invitation and complete registration (Public endpoint)
     */
    public acceptInvitation = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data: RegisterWithInvitationDto = req.body;

            const user = await this.invitationService.acceptInvitation(data);

            res.status(200).json(
                ResponseUtil.success("Registration completed successfully", user)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cancel an invitation (Admin only)
     */
    public cancelInvitation = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            // TODO: Add admin role check

            const invitationId = Number(req.params.id);

            if (isNaN(invitationId)) {
                throw new HttpException(400, "Invalid invitation ID");
            }

            await this.invitationService.cancelInvitation(invitationId);

            res.status(200).json(
                ResponseUtil.deleted("Invitation canceled successfully")
            );
        } catch (error) {
            next(error);
        }
    };
}

export default InvitationController;
