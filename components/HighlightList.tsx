'use client';

import { Highlight } from '@/lib/types';
import { Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion'; // Keep AnimatePresence if it's still used elsewhere or for future use, though motion.div is removed.

interface HighlightListProps {
    highlights: Highlight[];
    bookId: string;
    onDelete: (id: string) => void;
}

export default function HighlightList({ highlights, bookId, onDelete }: HighlightListProps) {
    const [copyingId, setCopyingId] = useState<string | null>(null);

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyingId(id);
            setTimeout(() => setCopyingId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {highlights.map((highlight) => (
                    <div
                        key={highlight.id}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative group clearfix"
                    >
                        <div className="float-right ml-4 mb-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleCopy(highlight.text, highlight.id)}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Copy to clipboard"
                            >
                                {copyingId === highlight.id ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                            <button
                                onClick={() => onDelete(highlight.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete highlight"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 font-serif text-lg">
                            "{highlight.text}"
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 clear-both">
                            <div className="flex gap-4 flex-wrap">
                                {highlight.page && <span className="font-medium">Page: {highlight.page}</span>}
                                {highlight.location && <span>Loc: {highlight.location}</span>}
                                {highlight.dateAdded && <span className="text-gray-400">| {highlight.dateAdded}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </AnimatePresence>
            {highlights.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                    No highlights found for this book.
                </div>
            )}
        </div>
    );
}
