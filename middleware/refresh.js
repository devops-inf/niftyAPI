const express = require('express');
const axios = require('axios');
const base64 = require('base-64');
const fs = require('fs');
const dotenv = require('dotenv');

// Function to refresh access token
async function refreshAccessTokenIfNeeded(refreshToken) {
    const accessTokenExpiryTime = 3600;
    const currentTime = new Date().getTime();
    const timeToRefresh = 60;
    
    if (accessTokenExpiryTime - currentTime < timeToRefresh) {
        try {
            const requestBody = {
                grant_type: 'refresh_token',
                refresh_token: process.env.REFRESH_TOKEN,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
            };

            const response = await axios.post('https://openapi.niftypm.com/oauth/token', requestBody);
            return response.data.access_token;
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw error;
        }
    } else {
        return refreshToken; // Token is still valid, return the existing token
    }
}

// Middleware to automatically refresh access token if needed
async function tokenRefreshMiddleware(req, res, next) {
    try {
        const accessToken = process.env.ACCESS_TOKEN;
        const newAccessToken = await refreshAccessTokenIfNeeded(accessToken);
        process.env.ACCESS_TOKEN = newAccessToken; // Update the access token if refreshed
        next();
    } catch (error) {
        console.error('Error refreshing access token:', error);
        next(error); // Pass the error to the error handling middleware
    }
}

module.exports = {
    tokenRefreshMiddleware
};
