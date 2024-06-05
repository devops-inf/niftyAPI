const axios = require('axios');
const tokenStore = require('./tokenStore');

async function refreshAccessToken() {
  try {
    const response = await axios.post('https://openapi.niftypm.com/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: tokenStore.refreshToken
    });

    console.log(response.data)
    if (response.data && response.data.access_token && response.data.expires_in) {
      tokenStore.accessToken = response.data.access_token;
      tokenStore.expirationTime = Date.now() + response.data.expires_in * 1000;

      console.log('Access token refreshed successfully');
    } else {
      throw new Error('Failed to refresh access token: Invalid response from Nifty API');
    }
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    throw error;
  }
}

module.exports = refreshAccessToken;
