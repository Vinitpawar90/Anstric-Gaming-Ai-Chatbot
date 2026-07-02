import React from 'react';
import {
    Zap, CheckCircle2, AlertCircle, RotateCcw, Loader2,
} from 'lucide-react';
import { TrainingStatusResponse } from '@/types/agent.types';
import StatusBadge from './StatusBadge';

interface TrainingProgressPanelProps {
    trainingStatus: TrainingStatusResponse;
    isTraining: boolean;
    onRetrain: () => void;
}

const TrainingProgressPanel: React.FC<TrainingProgressPanelProps> = ({
    trainingStatus, isTraining, onRetrain,
}) => {
    const { status, progress, sources, metrics, timestamps, error } = trainingStatus;

    return (
        <div className="glass rounded-3xl p-6 border border-border/50 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Training Status</h3>
                        <p className="text-sm text-muted-foreground">
                            {timestamps.lastTraining
                                ? `Last trained ${new Date(timestamps.lastTraining).toLocaleDateString()}`
                                : 'No training run yet'}
                        </p>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>

            {/* Progress Bar */}
            {(status === 'pending' || status === 'in-progress' || status === 'completed' || status === 'failed') && (
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-foreground">Progress</span>
                        <span className="text-sm font-bold text-primary">{progress}%</span>
                    </div>
                    <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${status === 'completed' ? 'bg-green-500' : status === 'failed' ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                    { value: sources.embedded, label: 'Embedded' },
                    { value: sources.total, label: 'Total Sources' },
                    { value: metrics.vectorCount, label: 'Vectors' },
                    { value: metrics.failedSources, label: 'Failed' },
                ].map(({ value, label }) => (
                    <div key={label} className="bg-secondary/20 rounded-xl p-3 text-center border border-border/30">
                        <div className="text-2xl font-bold text-foreground">{value}</div>
                        <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* Error */}
            {status === 'failed' && error && (
                <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl mb-4">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-destructive">Training Error</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{error.message}</p>
                    </div>
                </div>
            )}

            {/* Success */}
            {status === 'completed' && (
                <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-green-500">Training Complete</p>
                        <p className="text-sm text-muted-foreground">
                            {sources.embedded} source{sources.embedded !== 1 ? 's' : ''} embedded with {metrics.vectorCount} vectors.
                        </p>
                    </div>
                </div>
            )}

            {/* Retrain - Hidden for now as per user request */}
            {/* {status === 'completed' && (
                <button
                    onClick={onRetrain}
                    disabled={isTraining}
                    className="flex items-center gap-2 px-6 py-2.5 border border-border text-foreground bg-secondary/20 hover:bg-secondary/40 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                    {isTraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Retrain Agent
                </button>
            )} */}
        </div>
    );
};

export default TrainingProgressPanel;
