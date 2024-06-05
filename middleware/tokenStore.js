let accessToken = process.env.ACCESS_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;
let expirationTime = Date.now() + 3600 * 1000; // Example initial expiration time

module.exports = {
  accessToken,
  refreshToken,
  expirationTime
};
