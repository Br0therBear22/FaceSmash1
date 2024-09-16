const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb'); // Import MongoDB client
const app = express();

// Middleware to serve static files (like index.html, images, etc.) and parse incoming JSON requests
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// MongoDB connection URL (assuming MongoDB is running on localhost)
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

let db, voteCollection;

// Connect to MongoDB
client.connect()
  .then(() => {
    // Select the database and collection
    db = client.db('votingApp'); // Database named 'votingApp'
    voteCollection = db.collection('votes'); // Collection named 'votes'
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));

// POST route to handle vote submissions
app.post('/vote', async (req, res) => {
  const { image } = req.body;

  try {
    // Increment the vote count for the selected image
    await voteCollection.updateOne(
      { image },                  // Query to find the document for the selected image
      { $inc: { count: 1 } },     // Increment the 'count' field by 1
      { upsert: true }            // Insert the document if it doesn't exist
    );

    // Retrieve the updated vote counts for both images
    const image1Votes = await voteCollection.findOne({ image: 'image1' });
    const image2Votes = await voteCollection.findOne({ image: 'image2' });

    // Send the updated vote counts as JSON back to the frontend
    res.json({
      image1: image1Votes ? image1Votes.count : 0, // Return 0 if image1 doesn't have votes yet
      image2: image2Votes ? image2Votes.count : 0  // Return 0 if image2 doesn't have votes yet
    });
  } catch (err) {
    console.error('Error updating vote count:', err);
    res.status(500).send('Internal server error');
  }
});

// Start the server on port 3000 (or a different port if specified by an environment variable)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
