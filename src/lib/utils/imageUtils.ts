/**
 * Converts Google Drive share links to direct view URLs
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID (already direct)
 * - https://drive.google.com/thumbnail?id=FILE_ID&sz=w4000 (already direct)
 * 
 * @param url - The URL to convert
 * @returns Direct view URL or original URL if not a Google Drive link
 */
export const getDirectUrl = (url: string, width: number = 800): string => {
    if (!url) return "/fallback-product.jpg";

    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
        // If already a direct URL (uc?export or thumbnail), return as-is
        if (url.includes('/uc?') || url.includes('/thumbnail?')) {
            return url;
        }

        // Extract file ID from various formats
        let fileId = '';
        const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const match3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match1) fileId = match1[1];
        else if (match2) fileId = match2[1];
        else if (match3) fileId = match3[1];

        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
        }
    }
    
    // Basic validation for other URLs
    // Filter out obviously bad URLs like ":7070/..." or those without protocol that aren't assets
    // valid: https://..., http://..., /assets/..., data:image/...
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image') || url.startsWith('/')) {
        return url;
    }

    // Attempt to salvage if it looks like a domain but missing protocol
    if (url.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/)) {
         return `https://${url}`;
    }

    // Default Fallback - return standard placeholder or the url if we can't determine (but usually invalid)
    // For the specific error case ":7070/..." this will fall through.
    // If it's garbage, let's return a safe placeholder to stop console errors.
    console.warn("Filtered invalid image URL:", url);
    return "/fallback-product.jpg";
};

/**
 * Processes an array of image URLs, converting Google Drive links
 * @param urls - Array of image URLs
 * @returns Array of processed URLs
 */
export const processImageUrls = (urls: string[]): string[] => {
    return urls.map(url => getDirectUrl(url));
};
