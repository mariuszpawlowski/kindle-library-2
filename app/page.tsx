'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Book } from '@/lib/types';
import { getSurname } from '@/lib/utils';
import BookCard from '@/components/BookCard';
import UploadButton from '@/components/UploadButton';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import { History } from 'lucide-react';
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import AlphabetBar from '@/components/AlphabetBar';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'author' | 'title'>('author');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [gridReady, setGridReady] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data: Book[] = await res.json();
        // Sort by author surname
        data.sort((a, b) =>
          getSurname(a.author).localeCompare(getSurname(b.author))
        );
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

  // Per SORT-02: sort by surname (author mode) or title (title mode)
  const sortedBooks = useMemo(() => {
    const copy = [...books];
    if (sortMode === 'author') {
      copy.sort((a, b) => getSurname(a.author).localeCompare(getSurname(b.author)));
    } else {
      copy.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    }
    return copy;
  }, [books, sortMode]);

  // Per NAV-04: filter from sortedBooks so search + bar work together
  const filteredBooks = useMemo(() =>
    sortedBooks.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sortedBooks, searchTerm]
  );

  // Per NAV-04: available letters derived from filteredBooks using same key as sortMode
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    filteredBooks.forEach(book => {
      const key = sortMode === 'author'
        ? getSurname(book.author)
        : book.title.trim().toLowerCase();
      const initial = key[0]?.toUpperCase();
      if (initial && /[A-Z]/.test(initial)) set.add(initial);
    });
    return set;
  }, [filteredBooks, sortMode]);

  // Per IMPL-02: guard against Framer Motion 500ms entry animation race
  const handleLetterClick = (letter: string) => {
    if (!gridReady) return;
    setActiveLetter(letter);
    const target = document.querySelector(`[data-letter="${letter}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Per SORT-03, SORT-04: re-sort grid and reset active letter
  const handleSortChange = (mode: 'author' | 'title') => {
    setSortMode(mode);
    setActiveLetter(null); // SORT-04: reset active letter on sort change
  };

  // Scroll-spy: update activeLetter as the user scrolls through letter sections
  const scrollSpyRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    if (!gridReady) return;

    // Disconnect any previous observer before rebuilding
    scrollSpyRef.current?.disconnect();

    const anchors = Array.from(
      document.querySelectorAll<HTMLElement>('[data-letter]')
    );
    if (anchors.length === 0) return;

    // Track which letters are currently intersecting
    const visible = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const letter = (entry.target as HTMLElement).dataset.letter;
          if (letter) visible.set(letter, entry.isIntersecting);
        });

        // The topmost intersecting anchor wins
        const active = anchors.find(
          (el) => visible.get(el.dataset.letter ?? '') === true
        );
        if (active?.dataset.letter) {
          setActiveLetter(active.dataset.letter);
        }
      },
      {
        // Top edge: just below the sticky bar (64px); bottom: only top 30% of viewport matters
        rootMargin: "-64px 0px -70% 0px",
        threshold: 0,
      }
    );

    anchors.forEach((el) => observer.observe(el));
    scrollSpyRef.current = observer;

    return () => observer.disconnect();
  }, [gridReady, filteredBooks, sortMode]);

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
          <AuthButton />
        </header>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setActiveLetter(null);
          }}
        />

        <AlphabetBar
          letters={availableLetters}
          activeLetter={activeLetter}
          sortMode={sortMode}
          onLetterClick={handleLetterClick}
          onSortChange={handleSortChange}
        />

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
                onAnimationComplete={() => setGridReady(true)}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8"
              >
                {filteredBooks.map((book, idx) => {
                  // Determine if this is the first book with this initial in the current sorted/filtered list
                  const key = sortMode === 'author'
                    ? getSurname(book.author)
                    : book.title.trim().toLowerCase();
                  const initial = key[0]?.toUpperCase();
                  const isFirstInGroup =
                    initial !== undefined &&
                    /[A-Z]/.test(initial) &&
                    filteredBooks.findIndex(b => {
                      const bKey = sortMode === 'author'
                        ? getSurname(b.author)
                        : b.title.trim().toLowerCase();
                      return bKey[0]?.toUpperCase() === initial;
                    }) === idx;

                  return (
                    <div
                      key={book.id}
                      className={isFirstInGroup ? "scroll-mt-16" : undefined}
                      {...(isFirstInGroup ? { "data-letter": initial } : {})}
                    >
                      <BookCard book={book} />
                    </div>
                  );
                })}
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
