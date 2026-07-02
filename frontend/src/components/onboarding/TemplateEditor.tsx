import { useState, useEffect } from 'react';
import { onboardingService, OnboardingTemplate, OnboardingSection } from '@/services/onboardingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    Loader2,
    Save,
    FileText,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TemplateEditor() {
    const { toast } = useToast();
    const [template, setTemplate] = useState<OnboardingTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Section modal state
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState<OnboardingSection | null>(null);
    const [sectionForm, setSectionForm] = useState({
        title: '',
        description: '',
        documents: [] as Array<{ title: string; url: string }>,
    });

    // Delete confirmation
    const [deleteSection, setDeleteSection] = useState<OnboardingSection | null>(null);

    useEffect(() => {
        loadTemplate();
    }, []);

    const loadTemplate = async () => {
        try {
            setIsLoading(true);
            const data = await onboardingService.getTemplate();
            setTemplate(data);
        } catch (error) {
            console.error('Failed to load template:', error);
            toast({
                title: 'Error',
                description: 'Failed to load onboarding template',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!template) return;

        setIsSaving(true);
        try {
            await onboardingService.updateTemplate(template);
            toast({
                title: 'Saved!',
                description: 'Onboarding template updated successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save template',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const openAddSection = () => {
        setEditingSection(null);
        setSectionForm({ title: '', description: '', documents: [] });
        setShowSectionModal(true);
    };

    const openEditSection = (section: OnboardingSection) => {
        setEditingSection(section);
        setSectionForm({
            title: section.title,
            description: section.description,
            documents: section.documents || [],
        });
        setShowSectionModal(true);
    };

    const handleSaveSection = () => {
        if (!sectionForm.title.trim()) return;

        if (editingSection) {
            // Update existing section
            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: prev.sections?.map(s =>
                        s.day === editingSection.day
                            ? { ...s, title: sectionForm.title, description: sectionForm.description, documents: sectionForm.documents }
                            : s
                    ),
                };
            });
        } else {
            // Add new section
            const newSection: OnboardingSection = {
                day: (template?.sections?.length || 0) + 1,
                title: sectionForm.title,
                description: sectionForm.description,
                documents: sectionForm.documents,
                id: Date.now(), // Frontend only
                document_ids: [],
            };
            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: [...(prev.sections || []), newSection],
                };
            });
        }

        setShowSectionModal(false);
        setSectionForm({ title: '', description: '', documents: [] });
    };

    const handleDeleteSection = () => {
        if (!deleteSection) return;

        setTemplate(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                sections: prev.sections?.filter(s => s.day !== deleteSection.day),
            };
        });

        setDeleteSection(null);
    };

    const addDocument = () => {
        setSectionForm(prev => ({
            ...prev,
            documents: [...prev.documents, { title: '', url: '' }],
        }));
    };

    const updateDocument = (index: number, field: 'title' | 'url', value: string) => {
        setSectionForm(prev => ({
            ...prev,
            documents: prev.documents.map((doc, i) =>
                i === index ? { ...doc, [field]: value } : doc
            ),
        }));
    };

    const removeDocument = (index: number) => {
        setSectionForm(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index),
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Onboarding Template</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure the onboarding steps for new users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={openAddSection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
                {template?.sections?.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            <p>No sections yet. Click "Add Section" to create one.</p>
                        </CardContent>
                    </Card>
                ) : (
                    template?.sections?.map((section, index) => (
                        <Card key={section.day} className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{section.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {section.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditSection(section)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeleteSection(section)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {section.documents && section.documents.length > 0 && (
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {section.documents.map((doc, docIndex) => (
                                            <div
                                                key={docIndex}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm"
                                            >
                                                <FileText className="h-3 w-3" />
                                                {doc.title}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Section Modal */}
            <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSection ? 'Edit Section' : 'Add New Section'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure the onboarding section details and documents.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="section-title">Title *</Label>
                            <Input
                                id="section-title"
                                placeholder="e.g., Company Policies"
                                value={sectionForm.title}
                                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="section-description">Description</Label>
                            <Textarea
                                id="section-description"
                                placeholder="Brief description of this section..."
                                value={sectionForm.description}
                                onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Documents</Label>
                                <Button variant="ghost" size="sm" onClick={addDocument}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Document
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {sectionForm.documents.map((doc, index) => (
                                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                placeholder="Document title"
                                                value={doc.title}
                                                onChange={(e) => updateDocument(index, 'title', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Document URL"
                                                value={doc.url}
                                                onChange={(e) => updateDocument(index, 'url', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => removeDocument(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSectionModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSection} disabled={!sectionForm.title.trim()}>
                            {editingSection ? 'Update Section' : 'Add Section'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteSection} onOpenChange={() => setDeleteSection(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteSection?.title}"? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSection}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
