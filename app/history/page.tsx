'use client';

import { useState, useEffect } from 'react';
import { DeletedItem, RenamedItem } from '@/lib/types';
import { ArrowLeft, RotateCcw, BookOpen, Highlighter, Edit2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function HistoryPage() {
    const [history, setHistory] = useState<(DeletedItem | RenamedItem)[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);
    const { authStatus } = useAuthenticator(context => [context.authStatus]);
    const isAuthenticated = authStatus === 'authenticated';

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        setRestoring(id);
        try {
            const res = await fetch(`/api/history/${id}/restore`, { method: 'POST' });
            if (res.ok) {
                // Remove from local list
                setHistory(prev => prev.filter(item => item.id !== id));
            } else {
                alert('Failed to restore item');
            }
        } catch (error) {
            console.error('Failed to restore', error);
            alert('Error restoring item');
        } finally {
            setRestoring(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-8">
                    <Link href="/" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold">History</h1>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        No deleted items found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => {
                            if (item.type === 'rename') {
                                return (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                    <Edit2 size={12} /> Renamed
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-gray-500 line-through">{item.oldTitle}</span>
                                                    <ArrowRight size={16} className="text-gray-400" />
                                                    <span className="font-bold text-lg">{item.newTitle}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    <span className="line-through opacity-70">{item.oldAuthor}</span>
                                                    <ArrowRight size={14} className="text-gray-400" />
                                                    <span>{item.newAuthor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {item.type === 'book' ? (
                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                    <BookOpen size={12} /> Book
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                    <Highlighter size={12} /> Highlight
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                Deleted on {new Date(item.deletedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {item.type === 'book' ? (
                                            <div>
                                                <h3 className="font-bold text-lg">{item.title}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.author}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-serif italic text-gray-700 dark:text-gray-300 mb-1">"{item.text}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {isAuthenticated && (
                                        <button
                                            onClick={() => handleRestore(item.id)}
                                            disabled={restoring === item.id}
                                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors disabled:opacity-50"
                                            title="Restore"
                                        >
                                            <RotateCcw size={20} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
