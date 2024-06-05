const express = require('express');
const axios = require('axios');
const pool = require('../DB/sqlConnection');
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

router.get('/subtask', tokenRefreshMiddleware, async (req, res) => {
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
    await withRetry(() => insertSubTasks(niftyData, token));

    res.json(niftyData);  // Ensure a response is sent back to the client
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertSubTasks(niftyData, token) {
  let connection;
  try {
    connection = await pool.getConnection();

    for (const task of niftyData) {
      const { id = null, total_subtasks = null } = task;

      if (total_subtasks > 0) {
        const subtaskApiUrl = `https://openapi.niftypm.com/api/v1.0/tasks?limit=0&task_id=${id}`;
        const subtaskResponse = await axios.get(subtaskApiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });

        const niftySubTaskData = subtaskResponse.data.tasks;

        for (const subtask of niftySubTaskData) {
          const {
            id = null,
            created_at = null,
            name = null,
            archived = null,
            completed = null,
            project = null,
            assignees = null,
            created_by = null,
            completed_on = null,
            completed_by = null,
            description = null,
            due_date = null,
            start_date = null,
            task = null
          } = subtask;

          const assigneesJson = JSON.stringify(assignees);

          const [existingSubtask] = await connection.execute('SELECT id FROM subtasks WHERE id = ?', [id]);

          if (existingSubtask.length === 0) {
            const query = 'INSERT INTO subtasks (id, created_at, name, archived, completed, project, assignees, created_by, completed_on, completed_by, description, due_date, start_date, task) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [id, created_at, name, archived, completed, project, assigneesJson, created_by, completed_on, completed_by, description, due_date, start_date, task];
            await connection.execute(query, values);
            console.log(`Subtask ${id} inserted successfully.`);
          } else {
            const updateQuery = 'UPDATE subtasks SET created_at = ?, name = ?, archived = ?, completed = ?, project = ?, assignees = ?, created_by = ?, completed_on = ?, completed_by = ?, description = ?, due_date = ?, start_date = ?, task = ? WHERE id = ?';
            const updateValues = [created_at, name, archived, completed, project, assigneesJson, created_by, completed_on, completed_by, description, due_date, start_date, task, id];
            await connection.execute(updateQuery, updateValues);
            console.log(`Subtask ${id} updated successfully.`);
          }
        }
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
