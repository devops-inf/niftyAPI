

const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/member', async (req, res) => {
    try {
  
      // Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/members';
  
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
  
      // Check if the niftyData object contains the expected structure
      if (niftyData && Array.isArray(niftyData)) {
        // Insert project data into the database
        await insertMembers(niftyData, res);
        // Respond with the retrieved data
        res.json(niftyData);
      } else {
        console.error('Error: Invalid data format from Nifty');
        res.status(500).json({ message: 'Invalid data format from Nifty' });
      }
    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    async function insertMembers(niftyData, res){
      try {
        //iterate over each task and insert data
        
        for (const member of niftyData) {
          const { id, user_id, email, name, initials, team, role, total_story_points, completed_story_points} = member;

          // Check if the member already exists
          const existingMember = await client.query('SELECT * FROM members WHERE id = $1', [id]);

          if (existingMember.rows.length === 0) {
              // Member does not exist, insert it into the database
              const query = 'INSERT INTO members (id, user_id, email, name, initials, team, role, total_story_points, completed_story_points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
              const values = [id, user_id, email, name, initials, team, role, total_story_points, completed_story_points];
              await client.query(query, values);
              console.log(`Member ${id} inserted successfully.`);
          } else {
              // Member already exists, update it
              const updateQuery = 'UPDATE members SET user_id = $1, email = $2, name = $3, initials = $4, team = $5, role = $6, total_story_points = $7, completed_story_points = $8 WHERE id = $9';
              const updateValues = [user_id, email, name, initials, team, role, total_story_points, completed_story_points, id];
              await client.query(updateQuery, updateValues);
              console.log(`Member ${id} updated successfully.`);
            }
        }
      }catch (error) {
        console.error('Error inserting data:', error)
      }finally {
        await pool.end();
      }
    }
  });
  
  module.exports = router;