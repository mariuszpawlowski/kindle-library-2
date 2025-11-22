export async function fetchCover(title: string, author: string): Promise<string | undefined> {
    try {
        // Clean up title and author
        const cleanTitle = title.replace(/_/g, ' ').trim();
        const cleanAuthor = author.replace(/_/g, ' ').trim();

        // Try Open Library first
        const query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
        const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
        const data = await response.json();

        if (data.docs && data.docs.length > 0) {
            const doc = data.docs[0];
            if (doc.cover_i) {
                return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            }
        }

        // Fallback or other sources could be added here (e.g. Google Books)
        // Google Books API requires an API key for higher limits but works without for low usage
        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
        const googleData = await googleResponse.json();

        if (googleData.items && googleData.items.length > 0) {
            const volumeInfo = googleData.items[0].volumeInfo;
            if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                // Replace http with https
                return volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
            }
        }

        return undefined;
    } catch (error) {
        console.error('Error fetching cover:', error);
        return undefined;
    }
}
