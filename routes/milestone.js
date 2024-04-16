const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/milestone', async (req, res) => {
    try {
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/milestones?project_id=D8Q58hbe_fWw';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      // Make a GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if the response contains data
      if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.items;

      // Insert project data into the database
      await insertMilestones(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);

    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertMilestones(niftyData){
      try {
        //iterate over each task and insert data
        for (const milestone of niftyData) {
          const { id, name, created_at, created_by, description, dependency, start, end, archived, project, task_group, rule, tasks, assignees} = milestone;

          //convert array to JSON string
          const tasksJson = JSON.stringify(tasks);
          const assigneesJson = JSON.stringify(assignees);
          
          // Check if the portfolio already exists
          const existingMilestone = await client.query('SELECT * FROM milestones WHERE id = $1', [id]);
          
          if (existingMilestone.rows.length === 0) {
            // Task does not exist, insert it into the database
            const query = 'INSERT INTO milestones (id, name, created_at, created_by, description, dependency, start, end, archived, project, task_group, rule, tasks, assignees) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)'
            const values = [id, name, created_at, created_by, description, dependency, start, end, archived, project, task_group, rule, tasksJson, assigneesJson];
            await client.query(query, values);
            console.log(`Milestone ${id} inserted successfully.`);
          } else {
            // Task already exists, (Add an update query here --Next task)
            console.log(`Milestone ${id} already exists.`);
          }
          
        }
      } catch (error) {
        console.error('Error inserting data:', error)
        throw error;
      }
    }
  });
  
  module.exports = router;