const express = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const axios = require('axios');
const pool = require('../DB/pgConnection');
const client = require('../DB/pgConnection');
const router = express.Router();

router.get('/message', async (req, res) => {
    try {
      // Assuming the Nifty API endpoint for fetching data
      const niftyApiUrl = 'https://openapi.niftypm.com/api/v1.0/messages';
  
      // Get the token from the session
      const token = process.env.ACCESS_TOKEN;
  
      // Make a GET request to the Nifty API
      const response = await axios.get(niftyApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if the response contains data
      if (!response.data || !response.data.messages || !Array.isArray(response.data.messages)) {
        throw new Error('Response data is not in the expected format');
      }
      // Process the response from the Nifty API
      const niftyData = response.data.messages;

      // Insert project data into the database
      await insertMessages(niftyData);

      // Respond with the retrieved data
      res.json(niftyData);

    } catch (error) {
      // Handle errors
      console.error('Error retrieving data from Nifty:', error);
      res.status(500).json({ message: 'Internal server error' });
    }

    //Inserting data into the database
    async function insertMessages(niftyData){
      try {
        //iterate over each task and insert data
        for (const messagee of niftyData) {
          const { id, type, text, url, chat, thread, task, file, document, entity_key, author, replies, repliers, tagged, doc_attachment, attachments, is_edited, is_deleted, created_at, updated_at, annotation_id, audio_duration, heard} = messagee;

          //convert array to JSON string
          const repliersJson = JSON.stringify(repliers);
          const taggedJson = JSON.stringify(tagged);
          const attachmentsJson = JSON.stringify(attachments);

          // Check if the portfolio already exists
          const existingMessage = await client.query('SELECT * FROM messages WHERE id = $1', [id]);
          
          if (existingMessage.rows.length === 0) {
            // Task does not exist, insert it into the database
            const query = 'INSERT INTO messages (id, type, text, url, chat, thread, task, file, document, entity_key, author, replies, repliers, tagged, doc_attachment, attachments, is_edited, is_deleted, created_at, updated_at, annotation_id, audio_duration, heard) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)'
            const values = [id, type, text, url, chat, thread, task, file, document, entity_key, author, replies, repliersJson, taggedJson, doc_attachment, attachmentsJson, is_edited, is_deleted, created_at, updated_at, annotation_id, audio_duration, heard];
            await client.query(query, values);
            console.log(`Message ${id} inserted successfully.`);
          } else {
            // Task already exists, (Add an update query here --Next task)
            console.log(`Message ${id} already exists.`);
          }
          
        }
      } catch (error) {
        console.error('Error inserting data:', error)
        throw error;
      }
    }
  });
  
  module.exports = router;