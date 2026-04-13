import { NextRequest, NextResponse } from 'next/server';

// Allowlist of permitted hostname patterns for the image proxy.
// Private/loopback ranges and any host not matching are rejected.
const ALLOWED_HOSTNAME_PATTERNS: RegExp[] = [
    /^[a-z0-9-]+\.amazonaws\.com$/i,
    /^covers\.openlibrary\.org$/i,
    /^books\.google\.com$/i,
    /^[a-z0-9-]+\.googleusercontent\.com$/i,
    /^[a-z0-9-]+\.bookdepository\.com$/i,
];

// Private / loopback IP ranges that must never be fetched.
const PRIVATE_IP_PATTERN =
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1$|fc00:|fe80:)/i;

function isAllowedUrl(raw: string): boolean {
    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        return false;
    }

    // Only HTTPS allowed
    if (parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    // Block private/loopback addresses
    if (PRIVATE_IP_PATTERN.test(hostname)) return false;

    // Must match at least one allowlisted pattern
    return ALLOWED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isAllowedUrl(url)) {
        return NextResponse.json({ error: 'URL not permitted' }, { status: 403 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error: unknown) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
