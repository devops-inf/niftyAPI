const express = require('express');
const axios = require('axios');
const db = require('../DB/pgConnection');
const router = express.Router();

router.get('/project', async (req, res) => {
  try {
    const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/projects?limit=0';
    const token = process.env.ACCESS_TOKEN;

    const response = await axios.get(niftyApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.projects || !Array.isArray(response.data.projects)) {
      throw new Error('Invalid response data format');
    }

    const niftyData = response.data;
    await insertProjects(niftyData);

    res.json(niftyData);

  } catch (error) {
    console.error('Error retrieving and inserting data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

  async function queryAsync(query, values) {
    return new Promise((resolve, reject) => {
      db.query(query, values, (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  }
  // Function to insert project data into the database
  async function insertProjects(niftyData) {
    try {
      for (const project of niftyData.projects) {
        const { id, nice_id, name, description, initials, owner, members, progress, email } = project;

        const membersJson = JSON.stringify(members);

        const existingProject = await queryAsync('SELECT * FROM project WHERE id = ?', [id]);

        if (existingProject.length === 0) {
          const query = 'INSERT INTO project (id, nice_id, name, description, initials, owner, members, progress, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
          const values = [id, nice_id, name, description, initials, owner, membersJson, progress, email];
          await queryAsync(query, values);
          console.log(`Project ${id} inserted successfully.`);
        } else {
          const updateQuery = 'UPDATE project SET nice_id = ?, name = ?, description = ?, initials = ?, owner = ?, members = ?, progress = ?, email = ? WHERE id = ?';
          const updateValues = [nice_id, name, description, initials, owner, membersJson, progress, email, id];
          await queryAsync(updateQuery, updateValues);
          console.log(`Project ${id} updated successfully.`);
        }
      }
    } catch (error) {
      console.error('Error inserting project:', error);
    }
  }
});

module.exports = router;
