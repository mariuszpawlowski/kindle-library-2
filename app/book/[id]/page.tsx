'use client';

import { useEffect, useState, use } from 'react';
import { Book } from '@/lib/types';
import HighlightList from '@/components/HighlightList';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Book as BookIcon } from 'lucide-react';
import Link from 'next/link';

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/books/${id}`);
            if (res.ok) {
                const data = await res.json();
                setBook(data);
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Error fetching book:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBook();
    }, [id]);

    const handleDeleteBook = async () => {
        if (!confirm('Are you sure you want to delete this book and all its highlights?')) return;

        try {
            const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/');
            }
        } catch (error) {
            console.error('Error deleting book:', error);
        }
    };

    const handleDeleteHighlight = async (highlightId: string) => {
        if (!book) return;

        // Optimistic update
        const updatedHighlights = book.highlights.filter(h => h.id !== highlightId);
        setBook({ ...book, highlights: updatedHighlights });

        try {
            await fetch(`/api/highlights/${highlightId}?bookId=${book.id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error deleting highlight:', error);
            fetchBook(); // Revert on error
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!book) return null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto p-8">
                <div className="mb-8 flex justify-between items-start">
                    <Link
                        href="/"
                        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Library
                    </Link>
                    <button
                        onClick={handleDeleteBook}
                        className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={20} className="mr-2" />
                        Delete Book
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-12">
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="w-48 h-72 rounded-lg shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center p-4 text-center">
                                    <BookIcon size={64} className="mb-4" />
                                    <span className="text-sm">{book.title}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                        <h2 className="text-xl text-gray-500 mb-6">{book.author}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg inline-block shadow-sm">
                            <span className="text-2xl font-bold text-blue-600">
                                {book.highlights.length}
                            </span>
                            <span className="text-gray-500 ml-2">Highlights</span>
                        </div>
                    </div>
                </div>

                <HighlightList
                    highlights={book.highlights}
                    bookId={book.id}
                    onDelete={handleDeleteHighlight}
                />
            </div>
        </main>
    );
}
