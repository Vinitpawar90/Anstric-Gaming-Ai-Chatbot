import { Router } from "express";
import Route from "../../interfaces/route.interface";
import OnboardingController from "./onboarding.controller";
import validationMiddleware from "../../middlewares/validation.middleware";
import { CreateOnboardingTemplateDto, MarkSectionCompleteDto } from "./onboarding.dto";

class OnboardingRoute implements Route {
    public path = "/onboarding";
    public router = Router();
    public onboardingController = new OnboardingController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get active template (accessible to all authenticated users)
        this.router.get(
            `${this.path}/template`,
            this.onboardingController.getTemplate
        );

        // Update template (Admin only)
        this.router.put(
            `${this.path}/template`,
            validationMiddleware(CreateOnboardingTemplateDto, "body", false, []),
            this.onboardingController.upsertTemplate
        );

        // Get user's onboarding status
        this.router.get(
            `${this.path}/status`,
            this.onboardingController.getStatus
        );

        // Mark section complete
        this.router.post(
            `${this.path}/complete-section`,
            validationMiddleware(MarkSectionCompleteDto, "body", false, []),
            this.onboardingController.markSectionComplete
        );

        // Complete entire onboarding
        this.router.post(
            `${this.path}/complete`,
            this.onboardingController.completeOnboarding
        );

        // Get all users' status (Admin only)
        this.router.get(
            `${this.path}/all-users`,
            this.onboardingController.getAllUsersStatus
        );
    }
}

export default OnboardingRoute;
