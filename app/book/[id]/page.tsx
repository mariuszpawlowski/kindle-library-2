'use client';

import { useEffect, useState, useRef } from 'react';
import { Book } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Book as BookIcon, Trash2, Upload } from 'lucide-react';
import HighlightList from '@/components/HighlightList';

export default function BookPage() {
    const { id } = useParams();
    const router = useRouter();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingCover, setUploadingCover] = useState(false);

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/books/${id}`);
            if (res.ok) {
                const data = await res.json();
                setBook(data);
            } else {
                console.error('Failed to fetch book');
            }
        } catch (error) {
            console.error('Error fetching book:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBook();
        }
    }, [id]);

    const handleDeleteBook = async () => {
        if (!confirm('Are you sure you want to delete this book and all its highlights?')) return;

        try {
            const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to delete book:', error);
        }
    };

    const handleDeleteHighlight = async (highlightId: string) => {
        if (!confirm('Delete this highlight?')) return;

        // Optimistic update
        if (book) {
            const updatedHighlights = book.highlights.filter(h => h.id !== highlightId);
            setBook({ ...book, highlights: updatedHighlights });
        }

        try {
            await fetch(`/api/highlights/${highlightId}?bookId=${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to delete highlight:', error);
            fetchBook(); // Revert on error
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/books/${id}/cover`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (book) {
                    setBook({ ...book, coverUrl: `${data.coverUrl}?t=${Date.now()}` }); // Cache bust
                }
            } else {
                alert('Failed to upload cover');
            }
        } catch (error) {
            console.error('Cover upload error:', error);
            alert('Error uploading cover');
        } finally {
            setUploadingCover(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex flex-col items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Book not found</h1>
                <Link href="/" className="text-blue-500 hover:underline">
                    Go back home
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-500 mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Library
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 mb-12">
                    <div className="flex flex-col items-center">
                        <div className="relative w-full aspect-[2/3] rounded-lg shadow-xl overflow-hidden bg-gray-800 mb-4 group">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                    <BookIcon size={64} className="mb-4" />
                                    <span className="text-sm">{book.title}</span>
                                </div>
                            )}

                            {uploadingCover && (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCoverUpload}
                            accept="image/*"
                            className="hidden"
                        />

                        <div className="flex flex-col space-y-2 w-full px-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors text-sm py-2 border border-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                                <Upload size={16} className="mr-2" />
                                Change Cover
                            </button>
                            <button
                                onClick={handleDeleteBook}
                                className="flex items-center justify-center text-red-500 hover:text-red-600 transition-colors text-sm py-2 border border-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete Book
                            </button>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 mb-8">{book.author}</p>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Highlights ({book.highlights.length})</h2>
                        </div>

                        <HighlightList
                            highlights={book.highlights}
                            bookId={book.id}
                            onDelete={handleDeleteHighlight}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
