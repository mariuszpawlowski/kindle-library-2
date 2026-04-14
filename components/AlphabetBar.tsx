'use client';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetBarProps {
  letters: Set<string>;
  activeLetter: string | null;
  sortMode: 'author' | 'title';
  onLetterClick: (letter: string) => void;
  onSortChange: (mode: 'author' | 'title') => void;
}

export default function AlphabetBar({
  letters,
  activeLetter,
  sortMode,
  onLetterClick,
  onSortChange,
}: AlphabetBarProps) {
  return (
    <nav
      aria-label="Jump to books by letter"
      className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-2 mb-6 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1 sm:gap-2">

        {/* Sort toggle — per SORT-01, IMPL-03 */}
        <div
          role="group"
          aria-label="Sort order"
          className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 mr-2"
        >
          <button
            aria-pressed={sortMode === 'author'}
            onClick={() => onSortChange('author')}
            className={sortMode === 'author'
              ? "px-3 py-1 text-xs sm:text-sm font-semibold bg-blue-500 text-white transition-colors"
              : "px-3 py-1 text-xs sm:text-sm font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"}
          >
            Author
          </button>
          <span className="w-px bg-gray-200 dark:bg-gray-700 shrink-0" aria-hidden="true" />
          <button
            aria-pressed={sortMode === 'title'}
            onClick={() => onSortChange('title')}
            className={sortMode === 'title'
              ? "px-3 py-1 text-xs sm:text-sm font-semibold bg-blue-500 text-white transition-colors"
              : "px-3 py-1 text-xs sm:text-sm font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"}
          >
            Title
          </button>
        </div>

        {/* Divider */}
        <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 shrink-0" aria-hidden="true" />

        {/* 26 letter buttons — per NAV-01, NAV-02, IMPL-03, IMPL-04 */}
        {ALPHABET.map(letter => {
          const isActive = letters.has(letter);
          const isSelected = activeLetter === letter;

          return (
            <button
              key={letter}
              disabled={!isActive}
              aria-label={`Jump to books starting with ${letter}`}
              aria-current={isSelected ? true : undefined}
              onClick={() => onLetterClick(letter)}
              className={
                isSelected
                  ? "w-7 h-8 text-xs sm:text-sm font-medium rounded bg-blue-500 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors duration-150"
                  : isActive
                  ? "w-7 h-8 text-xs sm:text-sm font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors duration-150"
                  : "w-7 h-8 text-xs sm:text-sm font-medium rounded text-gray-400 dark:text-gray-500 opacity-40 cursor-not-allowed"
              }
            >
              {letter}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
