const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/status', async (req, res) => {
    try {
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/taskgroups';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      // Make a GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if the response contains data
      if (!response.data || !response.data.files || !Array.isArray(response.data.items)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.items;

      //A call function to Insert project data into the database
      await insertStatus(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);

    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertStatus(niftyData){
      try {
        //iterate over each task and insert data
        for (const status of niftyData) {
          const { id, name, order, project_id, milestone, is_completion_group, assignees} = status;

          //convert array to JSON string
          const assigneesJson = JSON.stringify(assignees);

          // Check if the portfolio already exists
          const existingFile = await client.query('SELECT * FROM statuses WHERE id = $1', [id]);
          
          if (existingFile.rows.length === 0) {
            // Task does not exist, insert it into the database
            const query = 'INSERT INTO statuses (id, name, order, project_id, milestone, is_completion_group, assignees) VALUES ($1, $2, $3, $4, $5, $6, $7)'
            const values = [id, name, order, project_id, milestone, is_completion_group, assigneesJson];
            await client.query(query, values);
            console.log(`Status ${id} inserted successfully.`);
          } else {
            // Task already exists, (Add an update query here --Next task)
            console.log(`Status ${id} already exists.`);
          }
          
        }
      } catch (error) {
        console.error('Error inserting data:', error)
        throw error;
      }
    }
  });
  
  module.exports = router;