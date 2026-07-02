import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService, OnboardingTemplate, OnboardingProgress } from '@/services/onboardingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Brain,
    CheckCircle2,
    Circle,
    FileText,
    ExternalLink,
    Loader2,
    PartyPopper,
    ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OnboardingWizard() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [template, setTemplate] = useState<OnboardingTemplate | null>(null);
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [completingSection, setCompletingSection] = useState<number | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    useEffect(() => {
        loadOnboardingData();
    }, []);

    const loadOnboardingData = async () => {
        try {
            setIsLoading(true);
            const [templateData, statusData] = await Promise.all([
                onboardingService.getTemplate(),
                onboardingService.getStatus(),
            ]);
            setTemplate(templateData);
            // Extract progress from status
            if (statusData.progress) {
                setProgress(statusData.progress);
            }
        } catch (error) {
            console.error('Failed to load onboarding data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load onboarding content',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteSection = async (sectionDay: number) => {
        if (!template) return;
        setCompletingSection(sectionDay);
        try {
            const updatedProgress = await onboardingService.completeSection({
                template_id: template.id,
                section_day: sectionDay,
            });

            // Update local progress
            setProgress(updatedProgress);

            toast({
                title: 'Section completed!',
                description: 'Great progress! Keep going.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to mark section complete',
                variant: 'destructive',
            });
        } finally {
            setCompletingSection(null);
        }
    };

    const handleCompleteOnboarding = async () => {
        setIsCompleting(true);
        try {
            await onboardingService.completeOnboarding();

            toast({
                title: '🎉 Onboarding Complete!',
                description: 'Welcome to the team! Redirecting to dashboard...',
            });

            // Redirect to dashboard after delay
            setTimeout(() => {
                navigate('/employee/dashboard');
            }, 2000);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to complete onboarding',
                variant: 'destructive',
            });
        } finally {
            setIsCompleting(false);
        }
    };

    const isSectionCompleted = (sectionDay: number) => {
        return progress?.completed_sections?.includes(sectionDay) || false;
    };

    const allSectionsCompleted = () => {
        if (!template?.sections || !progress?.completed_sections) return false;
        return template.sections.every(s => progress.completed_sections.includes(s.day));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading onboarding...</p>
                </div>
            </div>
        );
    }

    // All complete state
    if (progress?.is_completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
                <Card className="max-w-md text-center">
                    <CardContent className="pt-6">
                        <PartyPopper className="h-16 w-16 mx-auto text-primary" />
                        <h2 className="mt-4 text-2xl font-bold">All Done!</h2>
                        <p className="mt-2 text-muted-foreground">
                            You've completed your onboarding. Welcome to the team!
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => navigate('/employee/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur-lg sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Brain className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Welcome to Anstric Gaming</h1>
                            <p className="text-sm text-muted-foreground">Complete your onboarding</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium">Your Progress</span>
                            <Badge variant="secondary">
                                {Math.round((progress?.completed_sections?.length || 0) / (template?.sections?.length || 1) * 100)}%
                            </Badge>
                        </div>
                        <Progress
                            value={Math.round((progress?.completed_sections?.length || 0) / (template?.sections?.length || 1) * 100)}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {progress?.completed_sections?.length || 0} of {template?.sections?.length || 0} sections completed
                        </p>
                    </CardContent>
                </Card>

                {/* Sections */}
                <div className="space-y-4">
                    {template?.sections?.map((section, index) => {
                        const isCompleted = isSectionCompleted(section.day);
                        const isCompletingThis = completingSection === section.day;

                        return (
                            <Card
                                key={section.day}
                                className={`transition-all ${isCompleted ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : 'bg-secondary text-muted-foreground'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <span className="text-sm font-medium">{index + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{section.title}</CardTitle>
                                            <CardDescription>{section.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    {/* Documents */}
                                    {section.documents && section.documents.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            <p className="text-sm font-medium text-muted-foreground">Required Reading:</p>
                                            {section.documents.map((doc, docIndex) => (
                                                <a
                                                    key={docIndex}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                                >
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm flex-1">{doc.title}</span>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {/* Complete Button */}
                                    {!isCompleted && (
                                        <Button
                                            onClick={() => handleCompleteSection(section.day)}
                                            disabled={isCompletingThis}
                                            className="mt-2"
                                        >
                                            {isCompletingThis ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Marking Complete...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Mark as Complete
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {isCompleted && (
                                        <div className="flex items-center gap-2 text-green-600 text-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Section completed</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Complete Onboarding Button */}
                {allSectionsCompleted() && (
                    <div className="mt-8 text-center">
                        <Separator className="mb-8" />
                        <h2 className="text-xl font-bold mb-2">🎉 All Sections Complete!</h2>
                        <p className="text-muted-foreground mb-6">
                            You're ready to start using Anstric Gaming.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleCompleteOnboarding}
                            disabled={isCompleting}
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Finishing...
                                </>
                            ) : (
                                <>
                                    Finish Onboarding
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
