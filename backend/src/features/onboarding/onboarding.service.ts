import knex from "../../../database/index.schema";
import HttpException from "../../exceptions/HttpException";
import { CreateOnboardingTemplateDto, MarkSectionCompleteDto } from "./onboarding.dto";
import { IOnboardingTemplate, IOnboardingProgress, IOnboardingStatus } from "./onboarding.interface";

class OnboardingService {
    /**
     * Get active onboarding template (only one exists)
     */
    public async getActiveTemplate(): Promise<IOnboardingTemplate | null> {
        try {
            const template = await knex("onboarding_templates")
                .first();

            if (!template) {
                return null;
            }

            return {
                ...template,
                sections: typeof template.sections === 'string'
                    ? JSON.parse(template.sections)
                    : template.sections,
                is_active: true // Schema doesn't have is_active, assume single template is always active
            };
        } catch (error: any) {
            throw new HttpException(500, `Error fetching template: ${error.message}`);
        }
    }

    /**
     * Create or update onboarding template (Admin only)
     */
    public async upsertTemplate(
        data: CreateOnboardingTemplateDto,
        userId: number
    ): Promise<IOnboardingTemplate> {
        try {
            // Check if template exists
            const existing = await knex("onboarding_templates")
                .first();

            let template;

            if (existing) {
                // Update existing
                [template] = await knex("onboarding_templates")
                    .where({ id: existing.id })
                    .update({
                        title: data.title,
                        sections: JSON.stringify(data.sections),
                        updated_at: new Date(),
                    })
                    .returning("*");
            } else {
                // Create new
                [template] = await knex("onboarding_templates")
                    .insert({
                        title: data.title,
                        sections: JSON.stringify(data.sections),
                        created_at: new Date(),
                        updated_at: new Date(),
                    })
                    .returning("*");
            }

            return {
                ...template,
                sections: typeof template.sections === 'string'
                    ? JSON.parse(template.sections)
                    : template.sections,
                is_active: true,
                created_by: userId,
                description: data.description || null
            };
        } catch (error: any) {
            throw new HttpException(500, `Error upserting template: ${error.message}`);
        }
    }

    /**
     * Get user's onboarding progress (simplified - using users.onboarding_completed)
     */
    public async getUserProgress(userId: number): Promise<IOnboardingProgress | null> {
        try {
            // Use onboarding_progress table with section_index approach
            const progressRecords = await knex("onboarding_progress")
                .where({ user_id: userId })
                .orderBy("section_index");

            if (progressRecords.length === 0) {
                return null;
            }

            const template = await this.getActiveTemplate();
            if (!template) return null;

            const completedSections = progressRecords
                .filter(p => p.completed)
                .map(p => p.section_index);

            const maxSection = Math.max(...progressRecords.map(p => p.section_index));

            return {
                id: progressRecords[0].id,
                user_id: userId,
                template_id: template.id,
                current_day: maxSection + 1,
                completed_sections: completedSections,
                started_at: progressRecords[0].created_at,
                completed_at: completedSections.length === template.sections.length ? new Date() : null,
                is_completed: completedSections.length === template.sections.length
            };
        } catch (error: any) {
            throw new HttpException(500, `Error fetching progress: ${error.message}`);
        }
    }

    /**
     * Initialize onboarding for a new user
     */
    public async initializeOnboarding(userId: number): Promise<IOnboardingProgress> {
        try {
            const template = await this.getActiveTemplate();

            if (!template) {
                throw new HttpException(404, "No active onboarding template found");
            }

            // Check if progress already exists
            const existing = await this.getUserProgress(userId);
            if (existing) {
                return existing;
            }

            // Create initial progress record
            await knex("onboarding_progress")
                .insert({
                    user_id: userId,
                    section_index: 0,
                    completed: false,
                    created_at: new Date(),
                });

            return {
                id: 1,
                user_id: userId,
                template_id: template.id,
                current_day: 1,
                completed_sections: [],
                started_at: new Date(),
                completed_at: null,
                is_completed: false
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error initializing onboarding: ${error.message}`);
        }
    }

    /**
     * Mark a section as complete
     */
    public async markSectionComplete(
        userId: number,
        data: MarkSectionCompleteDto
    ): Promise<IOnboardingProgress> {
        try {
            const template = await this.getActiveTemplate();
            if (!template) {
                throw new HttpException(404, "No template found");
            }

            // Mark section as complete
            await knex("onboarding_progress")
                .insert({
                    user_id: userId,
                    section_index: data.section_day - 1, // Convert day to index
                    completed: true,
                    completed_at: new Date(),
                    created_at: new Date(),
                })
                .onConflict(['user_id', 'section_index'])
                .merge({
                    completed: true,
                    completed_at: new Date(),
                });

            const progress = await this.getUserProgress(userId);

            if (progress && progress.is_completed) {
                await knex("users")
                    .where({ id: userId })
                    .update({ onboarding_completed: true });
            }

            return progress!;
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error marking section complete: ${error.message}`);
        }
    }

    /**
     * Get complete onboarding status for a user
     */
    public async getOnboardingStatus(userId: number): Promise<IOnboardingStatus> {
        try {
            const user = await knex("users")
                .where({ id: userId })
                .first();

            if (!user) {
                throw new HttpException(404, "User not found");
            }

            if (user.onboarding_completed) {
                return {
                    user_id: userId,
                    onboarding_completed: true,
                };
            }

            const template = await this.getActiveTemplate();
            if (!template) {
                return {
                    user_id: userId,
                    onboarding_completed: false,
                };
            }

            let progress = await this.getUserProgress(userId);
            if (!progress) {
                progress = await this.initializeOnboarding(userId);
            }

            const currentSection = template.sections.find(s => s.day === progress!.current_day);
            const nextSection = template.sections.find(s => s.day === progress!.current_day + 1);

            return {
                user_id: userId,
                onboarding_completed: false,
                progress,
                template,
                current_section: currentSection,
                next_section: nextSection,
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(500, `Error getting onboarding status: ${error.message}`);
        }
    }

    /**
     * Get all users' onboarding status (Admin only)
     */
    public async getAllUsersStatus(): Promise<any[]> {
        try {
            const users = await knex("users")
                .select('id', 'name', 'email', 'onboarding_completed', 'created_at');

            const statuses = await Promise.all(
                users.map(async (user) => {
                    if (user.onboarding_completed) {
                        return {
                            ...user,
                            progress: null,
                        };
                    }

                    const progress = await this.getUserProgress(user.id);
                    return {
                        ...user,
                        progress,
                    };
                })
            );

            return statuses;
        } catch (error: any) {
            throw new HttpException(500, `Error getting all users status: ${error.message}`);
        }
    }
}

export default OnboardingService;
