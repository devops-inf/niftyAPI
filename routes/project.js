const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/project', async (req, res) => {
  try {
    // ANifty API endpoint for fetching data
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/projects';

    // token from the session
    const token = process.env.ACCESS_TOKEN;

    //GET request to the Nifty API
    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Checks if response data contains projects
    if (!response.data || !response.data.projects || !Array.isArray(response.data.projects)) {
      throw new Error('Invalid response data format');
    }
    
    // Process the response from the Nifty API
    const niftyData = response.data;

    // Insert project data into the database
    await insertProjects(niftyData, response);
    
    // Respond with the retrieved data
    res.json(niftyData);

  } catch (error) {
      // Handle errors
      console.error('Error retrieving and inserting data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
 
  // Function to insert project data into the database
  async function insertProjects(niftyData, res) {
 
    try {

      // Iterate over each project and insert data
      for (const projects of niftyData.projects) {
        const { id, nice_id, name, description, initials, owner, members, progress, email, total_story_points, completed_story_points } = projects;
        
        // Convert members array to JSON string
        const membersJson = JSON.stringify(members);
        
        const query = 'INSERT INTO projects (id, nice_id, name, description, initials, owner, members, progress, email, total_story_points, completed_story_points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
        const values = [id, nice_id, name, description, initials, owner, membersJson, progress, email, total_story_points, completed_story_points];
        await client.query(query, values);
      }
      console.log('Data inserted successfully.');
    } catch (err) {
      console.error('Error inserting data:', err);
    } finally {
      await pool.end();
    }
  }
});

module.exports = router;
