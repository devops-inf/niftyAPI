const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise'); // Use mysql2/promise for async/await support
const router = express.Router();
// Database connection setup
const dbConfig = {
    host: 'rs19.cphost.co.za',
    user: 'infini13_kabelo',
    password: 'O]hCmzCIkz5H',
    database: 'infini13_infini13_niftydb'
  };
  
  // Function to create a new connection
  async function createDbConnection() {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  }

//Function to create a new connection
async function createDbConnection() {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
}

router.get('/subtask', /* authenticate, */ async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/tasks?limit=0';
    const token = process.env.ACCESS_TOKEN;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.tasks || !Array.isArray(response.data.tasks)) {
      throw new Error('Response data is not in the expected format');
    }

    const niftyData = response.data.tasks;
    await insertSubTasks(niftyData, token);

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertSubTasks(niftyData, token) {
  let connection;
  try {
    connection = await createDbConnection();

    for (const task of niftyData) {
      const {
        id = null,
        total_subtasks = null
      } = task;

      if (total_subtasks > 0) {
        // Task has subtasks, fetch subtasks from Nifty API
        const subtaskApiUrl = `https://openapi.niftypm.com/api/v1.0/tasks?limit=0&task_id=${id}`;
        const subtaskResponse = await axios.get(subtaskApiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const niftySubTaskData = subtaskResponse.data.tasks;
        for (const subtask of niftySubTaskData) {
          const {
            id = null,
            created_at = null,
            nice_id = null,
            name = null,
            archived = null,
            completed = null,
            project = null,
            assignees = null,
            created_by = null,
            description = null,
            due_date = null,
            start_date = null,
            task = null
          } = subtask;

          const assigneesJson = JSON.stringify(assignees);

          const [existingSubtask] = await connection.execute('SELECT id FROM subtasks WHERE id = ?', [id]); //Checks if exists

          if (existingSubtask.length === 0) {
            // Subtask does not exist, insert it into the database
            const query = 'INSERT INTO subtasks (id, created_at, nice_id, name, archived, completed, project, assignees, created_by, description, due_date, start_date, task) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [id, created_at, nice_id, name, archived, completed, project, assigneesJson, created_by, description, due_date, start_date, task];
            await connection.execute(query, values);
            console.log(`Subtask ${id} inserted successfully.`);
          } else {
            // Subtask already exists, update it
            const updateQuery = 'UPDATE subtasks SET created_at = ?, nice_id = ?, name = ?, archived = ?, completed = ?, project = ?, assignees = ?, created_by = ?, description = ?, due_date = ?, start_date = ?, task = ? WHERE id = ?';
            const updateValues = [created_at, nice_id, name, archived, completed, project, assigneesJson, created_by, description, due_date, start_date, task, id];
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
      await connection.end();
    }
  }
}

module.exports = router;
