/**
 * Ensures an image URL is absolute.
 * Handles both Cloudinary URLs (already absolute) and local uploads (may be relative).
 *
 * @param {string} url - The image URL to process
 * @returns {string} - The absolute image URL
 */
export const getImageUrl = (url) => {
  if (!url) return '';

  // If URL is already absolute (starts with http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL is relative (starts with /), prepend the API URL
  if (url.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    // Remove /api suffix if present to get base URL
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  }

  return url;
};

/**
 * Gets the first image URL from a product's images array.
 * Falls back to a placeholder if no images are available.
 *
 * @param {Array} images - Array of image objects with url property
 * @param {string} fallback - Fallback URL if no images
 * @returns {string} - The image URL
 */
export const getProductImageUrl = (images, fallback = 'https://placehold.co/400x400/FFC0CB/333?text=No+Image') => {
  const url = images?.[0]?.url;
  return url ? getImageUrl(url) : fallback;
};
