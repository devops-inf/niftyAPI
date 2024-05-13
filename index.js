// index.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser =  require('body-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'y6D0EVB9sxlU6TPFZWhKFudkFHE8cStwDeGkKhjKfUdGqRxo5sxEGhCtuzSr3Tz4',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000 * 60,
    httpOnly: true
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Routes
app.use('/auth', require('./middleware/auth'));
app.use('/api', require('./routes/project'));
app.use('/api', require('./routes/portfolio'));
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/members'));
app.use('/api', require('./routes/file'));
app.use('/api', require('./routes/message'));
app.use('/api', require('./routes/milestone'));
app.use('/api', require('./routes/status'));
app.use('/api', require('./routes/document'));

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
