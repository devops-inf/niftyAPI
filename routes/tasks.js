const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/task',/* authenticate,*/ async (req, res) => {
    try {
      // Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/tasks?limit=0';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      //GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if the response contains data
      if (!response.data || !response.data.tasks || !Array.isArray(response.data.tasks)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.tasks;
 
      // Insert project data into the database
      await insertTasks(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);
    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertTasks(niftyData){
      try {
        //iterate over each task and insert data
        for (const task of niftyData) {
          const { id, created_at, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone} = task;

          //convert array to JSON string
          const assigneesJson = JSON.stringify(assignees);
          const subscribersJson = JSON.stringify(subscribers);

          // Check if the portfolio already exists
          const existingTasks = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
          
          if (existingTasks.rows.length === 0) {
            // Task does not exist, insert it into the database
            const query = 'INSERT INTO tasks (id, created_at, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)'
            const values = [id, created_at, nice_id, name, completed, project, assigneesJson, subscribersJson, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone];
            await client.query(query, values);
            console.log(`Task ${id} inserted successfully.`);
          } else {
            // Task already exists, update it
            const updateQuery = 'UPDATE tasks SET name = $1, completed = $2, assignees = $3, subscribers = $4, total_subtasks = $5, completed_subtasks = $6, description = $7, due_date = $8, start_date = $9, milestone = $10 WHERE id = $11';
            const updateValues = [name, completed, assigneesJson, subscribersJson, total_subtasks, completed_subtasks, description, due_date, start_date, milestone, id];
            await client.query(updateQuery, updateValues);
            console.log(`Task ${id} updated successfully.`);
          }
        }
      } catch (error) {
        console.error('Error inserting data:', error)
        throw error;
      }
    }
  });
  
  module.exports = router;