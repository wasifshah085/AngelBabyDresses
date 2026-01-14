// Helper function to get full image URL
// Images are served from the API server, not Firebase

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export const getImageUrl = (url) => {
  if (!url) return null;

  // If already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative URL starting with /, prepend API base
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }

  // Otherwise prepend API base with /
  return `${API_BASE}/${url}`;
};

export default getImageUrl;
