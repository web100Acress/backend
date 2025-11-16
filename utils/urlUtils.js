/**
 * Utility functions for URL generation (Backend Version)
 * Works in both development (localhost) and production environments
 */

/**
 * Get the base URL for the application
 * @returns {string} Base URL (localhost in dev, 100acress.com in production)
 */
const getBaseUrl = () => {
  // Check for environment variable first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return 'https://100acress.com';
  } else {
    // Development environment - use localhost
    const port = process.env.FRONTEND_PORT || '3000';
    return `http://localhost:${port}`;
  }
};

/**
 * Generate contact card URL
 * @param {string} slug - Contact card slug
 * @returns {string} Full contact card URL
 */
const getContactCardUrl = (slug) => {
  return `${getBaseUrl()}/hi/${slug}`;
};

/**
 * Generate QR code URL for contact card (always uses production URL)
 * @param {string} slug - Contact card slug
 * @returns {string} QR code image URL
 */
const getQRCodeUrl = (slug) => {
  // Always use production URL for QR codes
  const productionUrl = `https://100acress.com/hi/${slug}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(productionUrl)}`;
};

/**
 * Check if current environment is localhost
 * @returns {boolean} True if localhost, false if production
 */
const isLocalhost = () => {
  return process.env.NODE_ENV !== 'production';
};

module.exports = {
  getBaseUrl,
  getContactCardUrl,
  getQRCodeUrl,
  isLocalhost
};
