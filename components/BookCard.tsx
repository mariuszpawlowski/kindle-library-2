'use client';

import { Book } from '@/lib/types';
import Link from 'next/link';
import { Book as BookIcon } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/book/${book.id}`}>
      <div className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105">
        <div className="relative w-40 h-60 rounded-lg shadow-lg overflow-hidden bg-gray-800 transition-shadow duration-300 group-hover:shadow-xl">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              width={160}
              height={240}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
              <BookIcon size={48} className="mb-2" />
              <span className="text-xs line-clamp-3">{book.title}</span>
            </div>
          )}
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </div>
        <div className="mt-3 text-center w-40">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
}
