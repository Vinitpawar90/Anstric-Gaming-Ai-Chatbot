import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    onRowClick,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortKey) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortOrder]);

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary/20 border-b border-border">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key as string}
                                    className="px-6 py-4 text-left text-sm font-semibold text-foreground"
                                >
                                    {column.sortable !== false ? (
                                        <button
                                            onClick={() => handleSort(column.key as string)}
                                            className="flex items-center gap-2 hover:text-primary transition-colors"
                                        >
                                            {column.label}
                                            {sortKey === column.key && (
                                                <span>
                                                    {sortOrder === 'asc' ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((item, index) => (
                            <tr
                                key={index}
                                onClick={() => onRowClick?.(item)}
                                className={`${onRowClick ? 'cursor-pointer hover:bg-secondary/20' : ''
                                    } transition-colors`}
                            >
                                {columns.map((column) => (
                                    <td key={column.key as string} className="px-6 py-4 text-sm text-foreground">
                                        {column.render ? column.render(item) : item[column.key as string]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
