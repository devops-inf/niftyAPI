const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../DB/sqlConnection');
const client = require('../DB/sqlConnection');
const router = express.Router();

router.get('/document', async (req, res) => {
  try {
    // ANifty API endpoint for fetching data
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/docs';

    // token from the session
    const token = process.env.ACCESS_TOKEN;

    //GET request to the Nifty API
    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Checks if response data contains projects
    if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
      throw new Error('Invalid response data format');
    }
    
    // Process the response from the Nifty API
    const niftyData = response.data;

    // A call function to Insert project data into the database
    await insertDocs(niftyData, response);
    
    // Respond with the retrieved data
    res.json(niftyData);

  } catch (error) {
      // Handle errors
      console.error('Error retrieving and inserting data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
 
  // Function to insert project data into the database
  async function insertDocs(niftyData, res) {
 
    try {

      // Iterate over each project and insert data
      for (const doc of niftyData.projects) {
        const { id, name, access_type, type, subtype, external_id, author, project_id, tasks, members, created_at, hasAccess } = doc;
        
        // Convert members array to JSON string
        const taskJson = JSON.stringify(tasks);
        const membersJson = JSON.stringify(members);
        
        // Check if the project already exists
        const existingProject = await client.query('SELECT * FROM documents WHERE id = $1', [id]);

        if (existingProject.rows.length === 0) {
            // Project does not exist, insert it into the database
            const query = 'INSERT INTO documents (id, name, access_type, type, subtype, external_id, author, project_id, tasks, members, created_at, hasAccess) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
            const values = [id, name, access_type, type, subtype, external_id, author, project_id, taskJson, membersJson, created_at, hasAccess ];
            await client.query(query, values);
            console.log(`Document ${id} inserted successfully.`);
        } else {
            // Project already exists, you can choose to update or skip it
            console.log(`Document ${id} already exists.`);
        }
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
