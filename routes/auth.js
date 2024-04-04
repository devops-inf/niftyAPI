const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const base64 = require('base-64');

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const router = express.Router();

// Route for handling the initial login request
router.post('/login', (req, res) => {
    // Hardcoded user credentials (for demo purposes)
    let clientIdd = process.env.EMAIL;
    let passwordd =  process.env.PASSWORD;

    // Check if the provided credentials match
    if (req.body.clientId === clientIdd && req.body.password === passwordd) {
        // Generate a JWT token
        id = process.env.CLIENT_ID
        const token = jwt.sign({ clientIdd }, process.env.APP_SECRET, { expiresIn: '10m' });
        const refreshToken = jwt.sign({ clientIdd }, process.env.APP_SECRET, { expiresIn: '14d' });

        // Set the session token
        req.session.token = token;
        req.session.refresh_token = refreshToken;

        console.log(req.session)
        

        // Redirect the user to the OAuth provider's authorization endpoint
        res.redirect('https://nifty.pm/authorize?response_type=code&client_id=waXB7jdXLIzD16tTDTdUsl1r307ApcUF&redirect_uri=https://infinitybrandsza.nifty.pm/&scope=file,doc,message,project,task,member,label,milestone,subtask,task_group,subteam,time_tracking');
    
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
        console.log("Invalid credentials");
    }
});

// Route for handling the callback from the OAuth provider
router.get('/callback', (req, res) => {
    // Extract the authorization code from the query parameters
    const authorizationCode = process.env.AUTH_CODE;

    // Encode Client ID and Client Secret in Base64
    const credentials = `${process.env.CLIENT_ID}:${process.env.APP_SECRET}`;
    const encodedCredentials = base64.encode(credentials);

    // Define the request body data for exchanging authorization code for an access token
    console.log("helow:",authorizationCode)
    const requestBody = {
        code: authorizationCode,
        refresh_token: "string",
        grant_type: 'authorization_code',
        redirect_uri: `https://infinitybrandsza.nifty.pm`
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
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        });
});

module.exports = router;
