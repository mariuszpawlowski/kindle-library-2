'use client';

import { useEffect, useState } from 'react';
import { Book } from '@/lib/types';
import BookCard from '@/components/BookCard';
import UploadButton from '@/components/UploadButton';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import { History } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data: Book[] = await res.json();
        // Sort by author alphabetically
        data.sort((a, b) => a.author.localeCompare(b.author));
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-end items-center mb-12 gap-4">
          <Link
            href="/history"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <History size={20} />
            <span>History</span>
          </Link>
        </header>

        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-2">No books found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? `No books found matching "${searchTerm}"` : 'Upload your "My Clippings.txt" file to get started.'}
                </p>
                {!searchTerm && <UploadButton onUploadComplete={fetchBooks} />}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8"
              >
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-12 flex justify-center pb-12">
        <UploadButton onUploadComplete={fetchBooks} />
      </div>
    </main>
  );
}
