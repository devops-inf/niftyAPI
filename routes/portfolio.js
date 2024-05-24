const express = require('express');
const axios = require('axios');
const db = require('../DB/pgConnection');
const router = express.Router();
const { tokenRefreshMiddleware } = require('../middleware/refresh');

router.get('/portfolio', /* tokenRefreshMiddleware, */ async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/subteams?limit=0';
    const token = process.env.ACCESS_TOKEN;

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
  try {
    for (const subteam of niftyData) {
      const {
        id = null,
        name = null,
        initials = null,
        owner = null,
        members = []
      } = subteam;

      const membersJson = JSON.stringify(members);

      const result = await db.query('SELECT * FROM portfolio WHERE id = ?', [id]);

      // Check if result is not null and has length greater than 0
      if (result && result.length > 0) {
        const existingPortfolio = result[0]; // Access the first row of the result
        // Now you can safely access the 'rows' property
        if (existingPortfolio.rows.length === 0) {
          // Insert new portfolio
          const query = 'INSERT INTO portfolio (id, name, initials, owner, members) VALUES (?, ?, ?, ?, ?)';
          const values = [id, name, initials, owner, membersJson];
          await db.query(query, values);
          console.log(`Portfolio ${id} inserted successfully.`);
        } else {
          // Update existing portfolio
          const updateQuery = 'UPDATE portfolio SET name = ?, initials = ?, owner = ?, members = ? WHERE id = ?';
          const updateValues = [name, initials, owner, membersJson, id];
          await db.query(updateQuery, updateValues);
          console.log(`Portfolio ${id} updated successfully.`);
        }
      } else {
        console.log(`No portfolio found with id ${id}. Inserting as a new portfolio.`);
        // Insert new portfolio since no existing portfolio found
        const query = 'INSERT INTO portfolio (id, name, initials, owner, members) VALUES (?, ?, ?, ?, ?)';
        const values = [id, name, initials, owner, membersJson];
        await db.query(query, values);
        console.log(`Portfolio ${id} inserted successfully.`);
      }
    }
  } catch (error) {
    console.error('Error inserting data: ', error);
  }
}


module.exports = router;