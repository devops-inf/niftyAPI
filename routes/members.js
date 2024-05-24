const express = require('express');
const axios = require('axios');
const db = require('../DB/pgConnection');
const router = express.Router();

router.get('/member', async (req, res) => {
    try {
      // Nifty API endpoint for fetching data
        const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/members?limit=0';
        // token from the session
        const token = process.env.ACCESS_TOKEN;
        //GET request to the Nifty API
        const response = await axios.get(niftyApiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // Process the response from the Nifty API
        const niftyData = response.data;

        //A call function to Insert project data into the database
        if (niftyData && Array.isArray(niftyData)) {
            await insertMembers(niftyData);
            res.json(niftyData); // Respond with the retrieved data
        } else {
            console.error('Error: Invalid data format from Nifty');
            res.status(500).json({ message: 'Invalid data format from Nifty' });
        }
    } catch (error) {
        console.error('Error retrieving data from Nifty:', error);
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
    async function insertMembers(niftyData) {
        try {
            for (const member of niftyData) {
                const { id, user_id, email, name, initials, team, role } = member;

                console.log(`Processing member: ${id}, ${name}, ${email}`);

                const existingMember = await queryAsync('SELECT * FROM member WHERE id = ?', [id]);

                if (existingMember.length === 0) {
                    const query = 'INSERT INTO member (id, user_id, email, name, initials, team, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
                    const values = [id, user_id, email, name, initials, team, role];
                    await queryAsync(query, values);
                    console.log(`Member ${id} inserted successfully.`);
                } else {
                    const updateQuery = 'UPDATE member SET user_id = ?, email = ?, name = ?, initials = ?, team = ?, role = ? WHERE id = ?';
                    const updateValues = [user_id, email, name, initials, team, role, id];
                    await queryAsync(updateQuery, updateValues);
                    console.log(`Member ${id} updated successfully.`);
                }
            }
        } catch (error) {
            console.error('Error inserting member:', error);
        } 
    }
});

module.exports = router;
