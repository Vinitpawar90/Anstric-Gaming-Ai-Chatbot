import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { FormData, FormErrors } from '../types';
import { AIProvider } from '@/types/agent.types';

interface AgentConfigFormProps {
    formData: FormData;
    errors: FormErrors;
    isLoading: boolean;
    isEditMode: boolean;
    availableModels: Record<string, string[]>;
    onInputChange: (field: keyof FormData, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const AgentConfigForm: React.FC<AgentConfigFormProps> = ({
    formData, errors, isLoading, isEditMode, availableModels,
    onInputChange, onSubmit, onCancel,
}) => {
    return (
        <form onSubmit={onSubmit} className="max-w-5xl">
            <div className="glass rounded-3xl p-8 space-y-10 border border-border/50 shadow-2xl">

                {/* Basic Information */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 px-1">
                                Agent Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => onInputChange('name', e.target.value)}
                                className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.name ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50`}
                                placeholder="e.g., HR Assistant"
                            />
                            {errors.name && <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 px-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => onInputChange('description', e.target.value)}
                                className="w-full h-[46px] px-4 bg-secondary/20 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                placeholder="What this agent does..."
                            />
                        </div>
                    </div>

                    {/* Active Status Toggle */}
                    <div className="mt-6 flex items-center gap-4 bg-secondary/10 p-4 rounded-2xl w-fit">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => onInputChange('is_active', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-secondary/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-sm" />
                        </label>
                        <span className="text-sm font-bold text-foreground">Active and Ready</span>
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* Provider Configuration */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h3 className="text-xl font-bold text-foreground">Provider Configuration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Provider */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 px-1">
                                AI Provider <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={formData.provider}
                                onChange={(e) => onInputChange('provider', e.target.value as AIProvider)}
                                className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.provider ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none capitalize cursor-pointer`}
                            >
                                {Object.keys(availableModels).map((provider) => (
                                    <option key={provider} value={provider} className="capitalize bg-card text-foreground">
                                        {provider}
                                    </option>
                                ))}
                            </select>
                            {errors.provider && <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.provider}</p>}
                        </div>

                        {/* Model */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 px-1">
                                Model <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={formData.model}
                                onChange={(e) => onInputChange('model', e.target.value)}
                                className={`w-full h-[46px] px-4 bg-secondary/20 border ${errors.model ? 'border-destructive' : 'border-border'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer`}
                            >
                                {availableModels[formData.provider]?.map((model) => (
                                    <option key={model} value={model} className="bg-card text-foreground">
                                        {model}
                                    </option>
                                ))}
                            </select>
                            {errors.model && <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.model}</p>}
                        </div>

                        {/* Temperature */}
                        <div className="space-y-2 md:col-span-2 max-w-md">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-foreground/80">Temperature (Creativity)</label>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                    {Number(formData.temperature ?? 0.7).toFixed(1)}
                                </span>
                            </div>
                            <div className="pt-3 pb-1">
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={formData.temperature}
                                    onChange={(e) => onInputChange('temperature', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-secondary/30 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 px-1">
                                <span>Precise</span><span>Balanced</span><span>Creative</span>
                            </div>
                            {errors.temperature && <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.temperature}</p>}
                        </div>
                    </div>
                </section>

                <div className="h-px bg-border/50" />

                {/* System Prompt */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-primary rounded-full" />
                            <h3 className="text-xl font-bold text-foreground">System Prompt</h3>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/80 px-1">
                            Instructions for the Agent <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={formData.system_prompt}
                            onChange={(e) => onInputChange('system_prompt', e.target.value)}
                            className={`w-full px-5 py-4 bg-secondary/20 border ${errors.system_prompt ? 'border-destructive' : 'border-border'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[200px] font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50`}
                            placeholder="Define how the AI agent should behave, its personality, and its core tasks..."
                        />
                        {errors.system_prompt && <p className="text-xs text-destructive mt-1 px-1 font-medium">{errors.system_prompt}</p>}
                    </div>
                </section>

                {/* Submit */}
                <div className="flex items-center gap-4 pt-6 border-t border-border/30">
                    <button
                        type="submit" disabled={isLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 h-[52px] bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isLoading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /><span>{isEditMode ? 'Updating...' : 'Creating...'}</span></>
                            : <><Save className="w-5 h-5" /><span>{isEditMode ? 'Update Configuration' : 'Create Agent'}</span></>
                        }
                    </button>
                    <button
                        type="button" onClick={onCancel} disabled={isLoading}
                        className="flex-1 sm:flex-none px-10 h-[52px] border border-border bg-background/50 text-foreground rounded-xl font-bold hover:bg-secondary/50 transition-all disabled:opacity-50 active:scale-95"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
};

export default AgentConfigForm;
