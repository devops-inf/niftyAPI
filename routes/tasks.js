const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/task',/* authenticate,*/ async (req, res) => {
    try {
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/tasks';
  
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

      // Insert project data into the database
      await insertTasks(res);

      // Respond with the retrieved data
      res.json(niftyData);
    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertTasks(res){
      try {
        //iterate over each task and insert data
        for (const task of res.data.tasks) {
          const { id, created_at, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone} = task;

          //convert array to JSON string
          const assigneesJson = JSON.stringify(assignees);
          const subscribersJson = JSON.stringify(assignees);

          //Query
          const query = 'INSERT INTO tasks (id, created_at, nice_id, name, completed, project, assigneesJson, subscribersJson, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone)'
          const values = [id, created_at, nice_id, name, completed, project, assigneesJson, subscribersJson, total_subtasks, completed_subtasks, created_by, description, due_date, start_date, milestone];
          await client.query(query, values);

        }
      } catch (error) {
        console.error('Error inserting data:', error)
      }
    }
  });
  
  module.exports = router;