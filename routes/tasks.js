const express = require('express');
const axios = require('axios');
const pool = require('../DB/sqlConnection'); // Use connection pool
const tokenRefreshMiddleware = require('../middleware/refresh');
const tokenStore = require('../middleware/tokenStore');
const router = express.Router();

// Retry function
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.error(`Retrying... (${i + 1}/${retries})`);
      await new Promise(res => setTimeout(res, 1000)); // Wait 1 second before retrying
    }
  }
}

router.get('/task', tokenRefreshMiddleware, async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/tasks?limit=0';
    const token = tokenStore.accessToken;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.tasks || !Array.isArray(response.data.tasks)) {
      throw new Error('Response data is not in the expected format');
    }

    const niftyData = response.data.tasks;
    await withRetry(() => insertTasks(niftyData, token));

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertTasks(niftyData) {
  let connection;
  try {
    connection = await pool.getConnection();

    for (const task of niftyData) {
      const {
        id = null,
        name = null,
        completed = null,
        completed_on = null,
        completed_by = null,
        project = null,
        assignees = [],
        total_subtasks = null,
        completed_subtasks = null,
        created_by = null,
        description = null,
        milestone = null,
        created_at = null,
        start_date = null,
        due_date = null
      } = task;

      // Convert array to JSON string
      const assigneesJson = JSON.stringify(assignees);

      // Check if the task already exists
      const [existingTasks] = await connection.execute('SELECT * FROM task WHERE id = ?', [id]);

      if (existingTasks.length === 0) {
        const query = 'INSERT INTO task (id, name, completed, completed_on, completed_by, project, assignees, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [id, name, completed, completed_on, completed_by, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date];
        await connection.execute(query, values);
        console.log(`Task ${id} inserted successfully.`);
      } else {
        const updateQuery = 'UPDATE task SET name = ?, completed = ?, completed_on = ?, completed_by = ?, project = ?, assignees = ?, total_subtasks = ?, completed_subtasks = ?, created_by = ?, description = ?, milestone = ?, created_at = ?, start_date = ?, due_date = ? WHERE id = ?';
        const updateValues =  [name, completed, completed_on, completed_by, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date, id];
        await connection.execute(updateQuery, updateValues);
        console.log(`Task ${id} updated successfully.`);
      }
    }
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = router;
