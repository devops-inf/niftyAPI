const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');

const router = express.Router();

router.get('/data',/* authenticate,*/ async (req, res) => {

  try {
    // Ensure that the user is authenticated
    // if (!req.user) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    // Assuming the Nifty API endpoint for fetching data
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/projects';

    // Get the token from the session
    const token = process.env.ACCESS_TOKEN;

    // Make a GET request to the Nifty API
    const res = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Check if response data contains projects
    if (!res.data || !res.data.projects || !Array.isArray(res.data.projects)) {
      throw new Error('Invalid response data format');
    }
    // Process the response from the Nifty API
    let niftyData = res.data;

    // Insert project data into the database
    await insertProjects(res);
    
    // Respond with the retrieved data
    res.json({niftyData});

      } catch (error) {
    // Handle errors
    console.error('Error retrieving and inserting data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
 
  // Function to insert project data into the database
  async function insertProjects(res) {
 
    try {

      // Iterate over each project and insert data
      for (const project of res.data.projects) {
        const { id, nice_id, name, description, initials, archived, owner, members } = project;
        
        // Convert members array to JSON string
        const membersJson = JSON.stringify(members);
        
        const query = 'INSERT INTO projects (id, nice_id, name, description, initials, archived, owner, members) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
        const values = [id, nice_id, name, description, initials, archived, owner, membersJson];
        await client.query(query, values);
      }
      console.log('Data inserted successfully.');
    } catch (err) {
      console.error('Error inserting data:', err);
    } finally {
      if (client) {
          //client.release();
      }
      await pool.end();
    }
  }
});

    

//     // Respond with the retrieved data
//     res.json(niftyData);
//   } catch (error) {
//     // Handle errors
//     console.error('Error retrieving data from Nifty:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.get('/portfolio',/* authenticate,*/ async (req, res) => {
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

    // Process the response from the Nifty API
    const niftyData = response.data;

    // Respond with the retrieved data
    res.json(niftyData);
  } catch (error) {
    // Handle errors
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
