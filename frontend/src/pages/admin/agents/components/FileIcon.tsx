import React from 'react';
import { FileText, File, FileCode } from 'lucide-react';

interface FileIconProps {
    fileType: string;
    className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, className = 'w-4 h-4' }) => {
    switch (fileType) {
        case 'pdf': return <FileText className={`${className} text-red-400`} />;
        case 'docx': return <FileText className={`${className} text-blue-400`} />;
        case 'md': return <FileCode className={`${className} text-purple-400`} />;
        default: return <File className={`${className} text-muted-foreground`} />;
    }
};

export default FileIcon;
