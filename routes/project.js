const express = require('express');
const axios = require('axios');
const pool = require('../DB/sqlConnection'); // Import the connection pool
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

router.get('/project', tokenRefreshMiddleware, async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/projects?limit=0';
    const token = tokenStore.accessToken;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.projects || !Array.isArray(response.data.projects)) {
      throw new Error('Response data is not in the expected format');
    }

    const niftyData = response.data.projects;
    await withRetry(() => insertProjects(niftyData, token));

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertProjects(niftyData) {
  let connection;
  try {
    connection = await pool.getConnection();

    for (const project of niftyData) {
      const {
        id = null,
        nice_id = null,
        name = null,
        description = null,
        initials = null,
        owner = null,
        members = [],
        progress = null,
        email = null
      } = project;

      const membersJson = JSON.stringify(members);

      const [existingProject] = await connection.execute('SELECT id FROM project WHERE id = ?', [id]);

      if (existingProject.length === 0) {
        const query = 'INSERT INTO project (id, nice_id, name, description, initials, owner, members, progress, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [id, nice_id, name, description, initials, owner, membersJson, progress, email];
        await connection.execute(query, values);
        console.log(`Project ${id} inserted successfully.`);
      } else {
        const updateQuery = 'UPDATE project SET nice_id = ?, name = ?, description = ?, initials = ?, owner = ?, members = ?, progress = ?, email = ? WHERE id = ?';
        const updateValues = [nice_id, name, description, initials, owner, membersJson, progress, email, id];
        await connection.execute(updateQuery, updateValues);
        console.log(`Project ${id} updated successfully.`);
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
