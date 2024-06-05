const express = require('express');
const axios = require('axios');
const pool = require('../DB/sqlConnection');
const router = express.Router();
const tokenRefreshMiddleware = require('../middleware/refresh');
const tokenStore = require('../middleware/tokenStore'); 

router.get('/portfolio', tokenRefreshMiddleware, async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/subteams?limit=0';
    
    // Use the latest access token from tokenStore
    const token = tokenStore.accessToken;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.subteams || !Array.isArray(response.data.subteams)) {
      throw new Error('Response data is not in the expected format');
    }

    const niftyData = response.data.subteams;
    await insertPortfolio(niftyData);

    res.json(niftyData);
  } catch (error) {
    console.error('Error retrieving data from Nifty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


async function insertPortfolio(niftyData) {
  let connection;
  try {
    connection = await pool.getConnection();

    for (const subteam of niftyData) {
      const {
        id = null,
        name = null,
        initials = null,
        owner = null,
        members = []
      } = subteam;

      const membersJson = JSON.stringify(members);

      const [result] = await connection.execute('SELECT * FROM portfolio WHERE id = ?', [id]);

      if (result && result.length > 0) {
        // Portfolio exists, update it
        const updateQuery = 'UPDATE portfolio SET name = ?, initials = ?, owner = ?, members = ? WHERE id = ?';
        const updateValues = [name, initials, owner, membersJson, id];
        await connection.execute(updateQuery, updateValues);
        console.log(`Portfolio ${id} updated successfully.`);
      } else {
        // Insert new portfolio
        const query = 'INSERT INTO portfolio (id, name, initials, owner, members) VALUES (?, ?, ?, ?, ?)';
        const values = [id, name, initials, owner, membersJson];
        await connection.execute(query, values);
        console.log(`Portfolio ${id} inserted successfully.`);
      }
    }
  } catch (error) {
    console.error('Error inserting data: ', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = router;
