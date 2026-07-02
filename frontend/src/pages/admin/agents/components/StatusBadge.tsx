import React from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
}

const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    idle: {
        label: 'Not Trained',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        icon: <Clock className="w-3 h-3" />,
    },
    pending: {
        label: 'Queued',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        icon: <Clock className="w-3 h-3" />,
    },
    'in-progress': {
        label: 'Training…',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    completed: {
        label: 'Trained',
        className: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: <XCircle className="w-3 h-3" />,
    },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const cfg = configs[status] ?? configs.idle;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

export default StatusBadge;
