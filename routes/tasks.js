const express = require('express');
const axios = require('axios');
const db = require('../DB/pgConnection');
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
    //Inserting data into the mySQL DB
    async function insertTasks(niftyData){
        try {
          //iterate over each task and insert data
          for (const task of niftyData) {
            const { id, nice_id, name, completed, project, assignees, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date} = task;
  
            //convert array to JSON string
            const assigneesJson = JSON.stringify(assignees);
  
            // Check if the portfolio already exists
            const existingTasks = await db.query('SELECT * FROM task WHERE id = ?', [id]);
            
            if (existingTasks.length === 0) {
              // Task does not exist, insert it into the database
              const query = 'INSERT INTO task (id, nice_id, name, completed, project, assignees, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)'
              const values = [id, nice_id, name, completed, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date];
              await db.query(query, values);
              console.log(`Task ${id} inserted successfully.`);
            } else {
              // Task already exists, update it
              const updateQuery = 'UPDATE task SET name = ?, nice_id = ?, completed = ?, project = ?, assignees = ?, total_subtasks = ?, completed_subtasks = ?, created_by = ?, description = ?, milestone = ?, created_at = ?, start_date = ?, due_date = ? WHERE id = ?';
              const updateValues = [name, nice_id, completed, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date, id];
              await db.query(updateQuery, updateValues);
              console.log(`Task ${id} updated successfully.`);
            }

            // Insert task assignees
            for (const assignee of assignees) {
              const assigneeInsertQuery = 'INSERT INTO Task_Assignees (task_id, member_id) VALUES (?, ?)';
              const assigneeInsertValues = [id, assignee];
              await db.query(assigneeInsertQuery, assigneeInsertValues);
              console.log(`Assigned ${assignee} to Task ${id}.`);
            }
          }
        } catch (error) {
          console.error('Error inserting data:', error)
          throw error;
        }
      }
    //Inserting data into the Postgress database
    // async function insertTasks(niftyData){
    //   try {
    //     //iterate over each task and insert data
    //     for (const task of niftyData) {
    //       const { id, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date} = task;

    //       //convert array to JSON string
    //       const assigneesJson = JSON.stringify(assignees);
    //       const subscribersJson = JSON.stringify(subscribers);

    //       // Check if the portfolio already exists
    //       const existingTasks = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
          
    //       if (existingTasks.rows.length === 0) {
    //         // Task does not exist, insert it into the database
    //         const query = 'INSERT INTO tasks (id, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)'
    //         const values = [id, nice_id, name, completed, project, assignees, subscribers, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date];
    //         await client.query(query, values);
    //         console.log(`Task ${id} inserted successfully.`);
    //       } else {
    //         // Task already exists, update it
    //         const updateQuery = 'UPDATE tasks SET name = $1, nice_id = $2, completed = $3, project = $4, assignees = $5, subscribers = $6, total_subtasks = $7, completed_subtasks = $8, created_by = $9, description = $10, milestone = $11, created_at = $12, start_date = $13, due_date = $14 WHERE id = $15';
    //         const updateValues = [name, nice_id, completed, project, assigneesJson, subscribersJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date, id];
    //         await client.query(updateQuery, updateValues);
    //         console.log(`Task ${id} updated successfully.`);
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error inserting data:', error)
    //     throw error;
    //   }
    // }
  });
  
  module.exports = router;