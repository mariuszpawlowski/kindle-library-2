'use client';

import { Highlight } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HighlightListProps {
    highlights: Highlight[];
    bookId: string;
    onDelete: (id: string) => void;
}

export default function HighlightList({ highlights, bookId, onDelete }: HighlightListProps) {
    return (
        <div className="space-y-4">
            <AnimatePresence>
                {highlights.map((highlight) => (
                    <motion.div
                        key={highlight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 relative group"
                    >
                        <blockquote className="text-gray-700 dark:text-gray-300 text-lg font-serif leading-relaxed mb-4">
                            "{highlight.text}"
                        </blockquote>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex gap-4 flex-wrap">
                                {highlight.page && <span className="font-medium">Page: {highlight.page}</span>}
                                {highlight.location && <span>Loc: {highlight.location}</span>}
                                {highlight.dateAdded && <span className="text-gray-400">| {highlight.dateAdded}</span>}
                            </div>
                            <button
                                onClick={() => onDelete(highlight.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                title="Delete highlight"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
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
