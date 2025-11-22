import { v4 as uuidv4 } from 'uuid';
import { Book, Highlight } from './types';

export function parseClippings(fileContent: string): Book[] {
    const entries = fileContent.split('==========').filter((e) => e.trim().length > 0);
    const booksMap = new Map<string, Book>();

    entries.forEach((entry) => {
        const lines = entry.trim().split('\n');
        if (lines.length < 3) return;

        const titleLine = lines[0].trim();
        const metaLine = lines[1].trim();
        const content = lines.slice(2).join('\n').trim();

        if (!content) return;

        // Extract Title and Author
        // Format: "Book Title (Author Name)"
        const authorMatch = titleLine.match(/\(([^)]+)\)$/);
        let title = titleLine;
        let author = 'Unknown Author';

        if (authorMatch) {
            author = authorMatch[1];
            title = titleLine.replace(authorMatch[0], '').trim();
        }

        // Extract Metadata (Location, Date, Page)
        // Format: "- Your Highlight on page 162 | Location 2481-2485 | Added on Date"
        // Format: "- Your Highlight on Location 123-124 | Added on Date"
        let location = '';
        let dateAdded = '';
        let page = '';

        const parts = metaLine.split('|');
        parts.forEach((part) => {
            let p = part.trim();
            // Remove leading dash if present (common in first part)
            p = p.replace(/^-/, '').trim();

            if (p.includes('Added on')) {
                dateAdded = p.replace('Added on', '').trim();
            } else if (p.includes('Location')) {
                location = p.replace('Location', '').trim();
            } else if (p.includes('page')) {
                const pageMatch = p.match(/page\s+(\d+)/i);
                if (pageMatch) {
                    page = pageMatch[1];
                } else {
                    page = p;
                }
            }
        });

        // Fallback: if location is empty but we have a first part that isn't date/page, maybe it's the old format?
        // But the loop above should cover it if it says "Location".
        // If the format is just "- Location 123", the loop handles it.

        const bookId = uuidv4(); // Temporary ID, will be reconciled later or used if new
        const highlight: Highlight = {
            id: uuidv4(),
            text: content,
            location,
            page,
            dateAdded,
        };

        // Create a unique key for the book to group highlights
        const bookKey = `${title}-${author}`;

        if (!booksMap.has(bookKey)) {
            booksMap.set(bookKey, {
                id: uuidv4(),
                title,
                author,
                highlights: [],
                lastUpdated: new Date().toISOString(),
            });
        }

        const book = booksMap.get(bookKey)!;
        // Avoid duplicates
        if (!book.highlights.some((h) => h.text === highlight.text)) {
            book.highlights.push(highlight);
        }
    });

    return Array.from(booksMap.values());
}
