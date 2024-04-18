const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/portfolio', async (req, res) => {
    try {
  
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/subteams';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      // Make a GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if the response contains data
      if (!response.data || !response.data.subteams || !Array.isArray(response.data.subteams)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.subteams;
      
      //A call function to Insert project data into the database
      await insertPortfolio(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);
    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    async function insertPortfolio(niftyData){
      try {
        //Iterate data 
        for (const subteams of niftyData) {
          const { id, name, initials, owner, members} = subteams;

          // Convert members array to JSON string
          const membersJson = JSON.stringify(members);

          // Check if the portfolio already exists
          const existingPortfolio = await client.query('SELECT * FROM portfolios WHERE id = $1', [id]);
        
          if (existingPortfolio.rows.length === 0) {
            // Portfolio does not exist, insert it into the database
            const query = 'INSERT INTO portfolios (id, name, initials, owner, members) VALUES ($1, $2, $3, $4, $5)';
            const values = [id, name, initials, owner, membersJson];
            await client.query(query, values);
            console.log(`Portfolio ${id} inserted successfully.`);
          } else {
              // Portfolio already exists, you can choose to update or skip it
              console.log(`Portfolio ${id} already exists.`);
          }

        }
      } catch (error) {
        console.error('Error inserting data: ', error);
      }
    }
  });
  
  module.exports = router;