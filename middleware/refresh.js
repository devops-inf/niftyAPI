const tokenStore = require('./tokenStore');
const refreshAccessToken = require('./refreshToken');

async function tokenRefreshMiddleware(req, res, next) {
  const currentTime = Date.now();

  // Check if the access token is about to expire in the next 5 minutes
  if (currentTime > tokenStore.expirationTime - 5 * 60 * 1000) {
    try {
      await refreshAccessToken();
    } catch (error) {
      return res.status(500).json({ message: 'Failed to refresh access token' });
    }
  }

  // Add the access token to the request headers
  req.headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
  next();
}

module.exports = tokenRefreshMiddleware;
