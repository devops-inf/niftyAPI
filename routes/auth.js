const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const base64 = require('base-64');
const fs = require('fs');
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const router = express.Router();

// Define your OAuth provider's authorization endpoint URL
const authorizationEndpoint = process.env.AUTH_URL;

// Route handler to initiate the OAuth authorization flow
router.get('/authorize', (req, res) => {


    // Redirect the user's browser to the authorization URL
    res.redirect(authorizationEndpoint);   

});

// Middleware to parse query parameters
router.use(express.urlencoded({ extended: true }));

// Route for handling the callback from the OAuth provider
router.get('/callback', (req, res) => {

    // Extract the authorization code from the query parameters
    //const authorizationCode = process.env.AUTH_CODE;
    const authorizationCode = req.query.code;

    // Encode Client ID and Client Secret in Base64
    const credentials = `${process.env.CLIENT_ID}:${process.env.APP_SECRET}`;
    const encodedCredentials = base64.encode(credentials);

    // Define the request body data for exchanging authorization code for an access token
    console.log("helow:",authorizationCode)
    const requestBody = {
        code: authorizationCode,
        refresh_token: "string",
        grant_type: 'authorization_code',
        redirect_uri: `https://niftypm.com`
    };
    

    // Define the headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encodedCredentials}`
    };

    // Make a POST request to exchange authorization code for an access token
    axios.post('https://openapi.niftypm.com/oauth/token', requestBody, { headers })
        .then(response => {
            console.log('Response:', response.data);
            // Send the access token in the response
            res.json({ access_token: response.data.access_token });

            // Load the .env file
            const envConfig = dotenv.parse(fs.readFileSync('.env'));

            // Modify the access token value
            envConfig.ACCESS_TOKEN = response.data.access_token;

            // Write the modified config back to the .env file
            fs.writeFileSync('.env', Object.keys(envConfig).map(key => `${key}=${envConfig[key]}`).join('\n'));
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        });
});

module.exports = router;
