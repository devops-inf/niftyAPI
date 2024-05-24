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

router.get('/task', /* authenticate, */ async (req, res) => {
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
    await insertTasks(niftyData);

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertTasks(niftyData) {
  let connection;
  try {
    connection = await createDbConnection();

    for (const task of niftyData) {
      const {
        id = null,
        nice_id = null,
        name = null,
        completed = null,
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
        const query = 'INSERT INTO task (id, nice_id, name, completed, project, assignees, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [id, nice_id, name, completed, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date];
        await connection.execute(query, values);
        console.log(`Task ${id} inserted successfully.`);
      } else {
        const updateQuery = 'UPDATE task SET nice_id = ?, name = ?, completed = ?, project = ?, assignees = ?, total_subtasks = ?, completed_subtasks = ?, created_by = ?, description = ?, milestone = ?, created_at = ?, start_date = ?, due_date = ? WHERE id = ?';
        const updateValues = [nice_id, name, completed, project, assigneesJson, total_subtasks, completed_subtasks, created_by, description, milestone, created_at, start_date, due_date, id];
        await connection.execute(updateQuery, updateValues);
        console.log(`Task ${id} updated successfully.`);
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
