import React from 'react';
import { Database, FileText, Loader2, PlayCircle, CheckSquare, Square, Unlink } from 'lucide-react';
import { Document } from '@/services/documentService';
import documentService from '@/services/documentService';
import FileIcon from './FileIcon';

interface DocumentPickerProps {
    documents: Document[];
    selectedDocIds: number[];
    linkedDocumentIds: number[];
    isLoadingDocs: boolean;
    isTraining: boolean;
    isActivelyTraining: boolean;
    onToggleDoc: (docId: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onTrain: () => void;
    onClearTraining: () => void;
    onUnlinkDoc: (docId: number) => void;
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({
    documents, selectedDocIds, linkedDocumentIds,
    isLoadingDocs, isTraining, isActivelyTraining,
    onToggleDoc, onSelectAll, onDeselectAll, onTrain, onClearTraining, onUnlinkDoc,
}) => (
    <div className="glass rounded-3xl p-6 border border-border/50 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Knowledge Base Documents</h3>
                    <p className="text-sm text-muted-foreground">Select documents to train this agent on</p>
                </div>
            </div>
            {documents.length > 0 && (
                <div className="flex items-center gap-2">
                    <button onClick={onSelectAll} className="text-xs text-primary hover:underline font-semibold">Select All</button>
                    <span className="text-muted-foreground text-xs">·</span>
                    <button onClick={onDeselectAll} className="text-xs text-muted-foreground hover:underline font-semibold">Deselect All</button>
                </div>
            )}
        </div>

        {/* Body */}
        {isLoadingDocs ? (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground text-sm">Loading documents…</span>
            </div>
        ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-foreground font-semibold">No ready documents found</p>
                <p className="text-muted-foreground text-sm mt-1">
                    Upload documents in the Knowledge Base first, then return here to train.
                </p>
            </div>
        ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {documents.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    const isLinked = linkedDocumentIds.includes(doc.id);
                    return (
                        <div
                            key={doc.id}
                            className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all text-left group ${isSelected
                                ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                                : 'bg-secondary/10 border-border/50 hover:bg-secondary/20 hover:border-border'
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => onToggleDoc(doc.id)}
                                className="flex flex-1 items-center gap-3 min-w-0"
                            >
                                <div className="flex-shrink-0">
                                    {isSelected
                                        ? <CheckSquare className="w-5 h-5 text-primary" />
                                        : <Square className="w-5 h-5 text-muted-foreground/40" />
                                    }
                                </div>
                                <div className="flex-shrink-0">
                                    <FileIcon fileType={doc.file_type} className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {doc.name || doc.original_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {doc.file_type.toUpperCase()} · {documentService.formatFileSize(doc.file_size)}
                                    </p>
                                </div>
                            </button>
                            {isLinked && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full font-bold">
                                        Linked
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* Footer CTA */}
        {documents.length > 0 && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/30">
                <p className="text-sm text-muted-foreground font-medium">
                    <span className="text-foreground font-bold">{selectedDocIds.length}</span> of {documents.length} documents selected
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClearTraining}
                        disabled={isTraining || isActivelyTraining}
                        className="flex items-center gap-2 px-4 h-[44px] bg-destructive/10 text-destructive rounded-xl font-bold text-sm hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-destructive/20 hover:border-transparent"
                    >
                        Clear Training
                    </button>
                    <button
                        type="button"
                        onClick={onTrain}
                        disabled={selectedDocIds.length === 0 || isTraining || isActivelyTraining}
                        className="flex items-center gap-2 px-6 h-[44px] bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isTraining || isActivelyTraining
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Training…</>
                            : <><PlayCircle className="w-4 h-4" />Train Agent</>
                        }
                    </button>
                </div>
            </div>
        )}
    </div>
);

export default DocumentPicker;
