const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../DB/sqlConnection');
const client = require('../DB/sqlConnection');
const router = express.Router();

router.get('/file', async (req, res) => {
    try {
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/files';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      // Make a GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if the response contains data
      if (!response.data || !response.data.files || !Array.isArray(response.data.files)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.files;

      // Insert project data into the database
      await insertFiles(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);

    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertFiles(niftyData){
      try {
        //iterate over each task and insert data
        for (const file of niftyData) {
          const { id, name, size, url, download, thumbnail, uploader, comments, created_at, googleId, googleType, processed, task, project_id, message, folder, folder_stack, document} = file;

          //convert array to JSON string
          const folder_stackJson = JSON.stringify(folder_stack);

          // Check if the portfolio already exists
          const existingFile = await client.query('SELECT * FROM files WHERE id = $1', [id]);
          
          if (existingFile.rows.length === 0) {
            // Task does not exist, insert it into the database
            const query = 'INSERT INTO files (id, name, size, url, download, thumbnail, uploader, comments, created_at, googleId, googleType, processed, task, project_id, message, folder, folder_stack, document) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)'
            const values = [id, name, size, url, download, thumbnail, uploader, comments, created_at, googleId, googleType, processed, task, project_id, message, folder, folder_stackJson, document];
            await client.query(query, values);
            console.log(`File ${id} inserted successfully.`);
          } else {
            // Task already exists, (Add an update query here --Next task)
            console.log(`File ${id} already exists.`);
          }
          
        }
      } catch (error) {
        console.error('Error inserting data:', error)
        throw error;
      }
    }
  });
  
  module.exports = router;