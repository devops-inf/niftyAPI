

const express = require('express');
const axios = require('axios');
const db = require('../DB/pgConnection');
const router = express.Router();

router.get('/member', async (req, res) => {
    try {
  
      // Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/members?limit=0';
  
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
          const { id, user_id, email, name, initials, team, role} = member;

          // Check if the member already exists
          const existingMember = await db.query('SELECT * FROM member WHERE id = ?', [id]);

          if (existingMember.length === 0) {
              // Member does not exist, insert it into the database
              const query = 'INSERT INTO member (id, user_id, email, name, initials, team, role) VALUES ($1, $2, $3, $4, $5, $6, $7)';
              const values = [id, user_id, email, name, initials, team, role];
              await db.query(query, values);
              console.log(`Member ${id} inserted successfully.`);
          } else {
              // Member already exists, update it
              const updateQuery = 'UPDATE member SET user_id = ?, email = ?, name = ?, initials = ?, team = ?, role = ? WHERE id = ?';
              const updateValues = [user_id, email, name, initials, team, role, id];
              await db.query(updateQuery, updateValues);
              console.log(`Member ${id} updated successfully.`);
            }
        }
      }catch (error) {
        console.error('Error inserting data:', error)
      }finally {
        await db.end();
      }
    }
  });
  
  module.exports = router;