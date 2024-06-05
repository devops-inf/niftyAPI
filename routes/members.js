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

router.get('/member', tokenRefreshMiddleware, async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/members?limit=0';
    const token = tokenStore.accessToken;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Response data is not in the expected format');
    }

    const niftyData = response.data;
    await withRetry(() => insertMembers(niftyData));

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function insertMembers(niftyData) {
  let connection;
  try {
    connection = await pool.getConnection();

    for (const member of niftyData) {
      const { id, user_id, email, name, initials, team, role } = member;

      // Check if the member already exists
      const [existingMembers] = await connection.execute('SELECT * FROM member WHERE id = ?', [id]);

      if (existingMembers.length === 0) {
        const query = 'INSERT INTO member (id, user_id, email, name, initials, team, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [id, user_id, email, name, initials, team, role];
        await connection.execute(query, values);
        console.log(`Member ${id} inserted successfully.`);
      } else {
        const updateQuery = 'UPDATE member SET user_id = ?, email = ?, name = ?, initials = ?, team = ?, role = ? WHERE id = ?';
        const updateValues = [user_id, email, name, initials, team, role, id];
        await connection.execute(updateQuery, updateValues);
        console.log(`Member ${id} updated successfully.`);
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
