import crypto from "crypto";
import knex from "../../../database/index.schema";
import HttpException from "../../exceptions/HttpException";
import { CreateInvitationDto, RegisterWithInvitationDto } from "./invitation.dto";
import { IInvitation, IInvitationValidation } from "./invitation.interface";

class InvitationService {
    private readonly INVITATION_EXPIRY_DAYS = 7;

    /**
     * Create a new invitation
     */
    public async createInvitation(
        data: CreateInvitationDto,
        invitedBy: number
    ): Promise<IInvitation> {
        try {
            // Check if user already exists
            const existingUser = await knex("users")
                .where({ email: data.email, is_deleted: false })
                .first();

            if (existingUser) {
                throw new HttpException(409, "A user with this email already exists");
            }

            // Check for existing pending invitation
            const existingInvitation = await knex("users")
                .where({ email: data.email })
                .whereNotNull('invitation_token')
                .whereRaw('invitation_expires > NOW()')
                .first();

            if (existingInvitation) {
                throw new HttpException(
                    409,
                    "An active invitation already exists for this email"
                );
            }

            // Generate secure token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + this.INVITATION_EXPIRY_DAYS);

            // Create user record with invitation
            const [invitation] = await knex("users")
                .insert({
                    email: data.email,
                    name: data.name || 'Invited User',
                    role: data.role,
                    password: 'PENDING_INVITATION', // Placeholder password
                    invitation_token: token,
                    invitation_expires: expiresAt,
                    invited_by: invitedBy,
                    created_by: invitedBy,
                    created_at: new Date(),
                    onboarding_completed: false,
                })
                .returning("*");

            return {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                invitation_token: invitation.invitation_token,
                invitation_expires: invitation.invitation_expires,
                invited_by: invitation.invited_by,
                created_at: invitation.created_at,
                is_accepted: false,
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error creating invitation: ${error.message}`);
        }
    }

    /**
     * Get all pending invitations
     */
    public async getPendingInvitations(): Promise<IInvitation[]> {
        try {
            const invitations = await knex("users")
                .where({ is_deleted: false })
                .whereNotNull('invitation_token')
                .whereRaw('invitation_expires > NOW()')
                .where('password', 'PENDING_INVITATION')
                .select('id', 'email', 'role', 'invitation_token', 'invitation_expires', 'invited_by', 'created_at');

            return invitations.map(inv => ({
                ...inv,
                is_accepted: false,
            }));
        } catch (error: any) {
            throw new HttpException(500, `Error fetching invitations: ${error.message}`);
        }
    }

    /**
     * Validate an invitation token
     */
    public async validateInvitationToken(token: string): Promise<IInvitationValidation> {
        try {
            const invitation = await knex("users")
                .where({
                    invitation_token: token,
                    is_deleted: false
                })
                .first();

            if (!invitation) {
                return {
                    valid: false,
                    error: 'Invalid invitation token'
                };
            }

            // Check if already accepted (password changed)
            if (invitation.password !== 'PENDING_INVITATION') {
                return {
                    valid: false,
                    error: 'This invitation has already been accepted'
                };
            }

            // Check expiration
            const now = new Date();
            const expiresAt = new Date(invitation.invitation_expires);

            if (now > expiresAt) {
                return {
                    valid: false,
                    error: 'This invitation has expired'
                };
            }

            return {
                valid: true,
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    role: invitation.role,
                    invitation_token: invitation.invitation_token,
                    invitation_expires: invitation.invitation_expires,
                    invited_by: invitation.invited_by,
                    created_at: invitation.created_at,
                    is_accepted: false,
                }
            };
        } catch (error: any) {
            throw new HttpException(500, `Error validating invitation: ${error.message}`);
        }
    }

    /**
     * Accept invitation and complete registration
     */
    public async acceptInvitation(
        data: RegisterWithInvitationDto
    ): Promise<any> {
        try {
            // Validate token first
            const validation = await this.validateInvitationToken(data.token);

            if (!validation.valid || !validation.invitation) {
                throw new HttpException(400, validation.error || 'Invalid invitation');
            }

            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Update user with actual credentials
            const [user] = await knex("users")
                .where({ invitation_token: data.token })
                .update({
                    name: data.name,
                    password: hashedPassword,
                    phone_number: data.phone_number || null,
                    invitation_token: null, // Clear token
                    updated_at: new Date(),
                })
                .returning("*");

            // Remove sensitive fields
            const { password, invitation_token, ...userResponse } = user;

            return userResponse;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error accepting invitation: ${error.message}`);
        }
    }

    /**
     * Cancel/delete an invitation
     */
    public async cancelInvitation(invitationId: number): Promise<void> {
        try {
            // Get invitation
            const invitation = await knex("users")
                .where({
                    id: invitationId,
                    is_deleted: false
                })
                .whereNotNull('invitation_token')
                .where('password', 'PENDING_INVITATION')
                .first();

            if (!invitation) {
                throw new HttpException(404, "Invitation not found or already accepted");
            }

            // Delete the user record (they haven't completed registration yet)
            await knex("users")
                .where({ id: invitationId })
                .delete();
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error canceling invitation: ${error.message}`);
        }
    }

    /**
     * Get invitation link
     */
    public getInvitationLink(token: string, baseUrl?: string): string {
        const base = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
        return `${base}/signup?token=${token}`;
    }

    /**
     * Clean up expired invitations (can be run as a cron job)
     */
    public async cleanupExpiredInvitations(): Promise<number> {
        try {
            const deleted = await knex("users")
                .where('password', 'PENDING_INVITATION')
                .whereRaw('invitation_expires < NOW()')
                .delete();

            return deleted;
        } catch (error: any) {
            throw new HttpException(500, `Error cleaning up invitations: ${error.message}`);
        }
    }
}

export default InvitationService;
