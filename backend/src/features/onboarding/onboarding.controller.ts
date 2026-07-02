import { NextFunction, Request, Response } from "express";
import { RequestWithUser } from "../../interfaces/auth.interface";
import OnboardingService from "./onboarding.service";
import { CreateOnboardingTemplateDto, MarkSectionCompleteDto } from "./onboarding.dto";
import HttpException from "../../exceptions/HttpException";
import ResponseUtil from "../../utils/response.util";

class OnboardingController {
    public onboardingService = new OnboardingService();

    /**
     * Get active onboarding template
     */
    public getTemplate = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const template = await this.onboardingService.getActiveTemplate();

            if (!template) {
                res.status(404).json(
                    ResponseUtil.error("No active onboarding template found")
                );
                return;
            }

            res.status(200).json(
                ResponseUtil.success("Template retrieved successfully", template)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Create or update onboarding template (Admin only)
     */
    public upsertTemplate = async (
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

            const data: CreateOnboardingTemplateDto = req.body;
            const template = await this.onboardingService.upsertTemplate(data, userId);

            res.status(200).json(
                ResponseUtil.success("Template saved successfully", template)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get user's onboarding status
     */
    public getStatus = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const status = await this.onboardingService.getOnboardingStatus(userId);

            res.status(200).json(
                ResponseUtil.success("Onboarding status retrieved successfully", status)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Mark a section as complete
     */
    public markSectionComplete = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            const data: MarkSectionCompleteDto = req.body;
            const progress = await this.onboardingService.markSectionComplete(userId, data);

            res.status(200).json(
                ResponseUtil.updated("Section marked as complete", progress)
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Complete entire onboarding
     */
    public completeOnboarding = async (
        req: RequestWithUser,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.userId || req.user?.id;

            if (!userId) {
                throw new HttpException(401, "User authentication required");
            }

            // Mark user as completed
            const knex = require("../../../database/index.schema").default;
            await knex("users")
                .where({ id: userId })
                .update({ onboarding_completed: true });

            res.status(200).json(
                ResponseUtil.success("Onboarding completed successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all users' onboarding status (Admin only)
     */
    public getAllUsersStatus = async (
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

            const statuses = await this.onboardingService.getAllUsersStatus();

            res.status(200).json(
                ResponseUtil.success("All users status retrieved successfully", statuses)
            );
        } catch (error) {
            next(error);
        }
    };
}

export default OnboardingController;
