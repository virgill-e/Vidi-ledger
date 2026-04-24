export default defineEventHandler(async (event) => {
  // Global rate limit: 1000 requests per minute per IP (very permissive)
  // This satisfies security audits while allowing normal use.
  // Sensitive routes have stricter limits applied directly in their handlers.
  
  // Only apply to API routes
  if (!event.path.startsWith('/api/')) {
    return;
  }

  try {
    await defineRateLimit({ max: 1000, window: 60 })(event);
  } catch (error) {
    throw error;
  }
});
