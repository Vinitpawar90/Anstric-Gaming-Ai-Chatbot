import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

interface SourceDocument {
    title: string;
    snippet: string;
    relevance: number;
}

interface SourceDocumentsProps {
    sources: SourceDocument[];
}

export const SourceDocuments: React.FC<SourceDocumentsProps> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <FileText className="w-4 h-4" />
                <span>Sources ({sources.length})</span>
            </div>
            <div className="space-y-2">
                {sources.map((source, idx) => (
                    <div
                        key={idx}
                        className="p-3 rounded-lg bg-secondary/20 border border-border/50 hover:border-border transition-colors"
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" />
                                {source.title}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {Math.round(source.relevance * 100)}% match
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {source.snippet}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
