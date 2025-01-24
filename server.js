const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/user'); // Import User model
const Event = require('./models/event'); // Import Event model

const app = express();
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: 'xx-secret-yy',  // Secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }  // Set to true in production with HTTPS
  }));

  
// MongoDB
mongoose.connect('mongodb://localhost:27017')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));


// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
  const userId = req.session.userId;
  res.render('index', { userId: userId });
});


app.get('/weather', (req, res) => {
  const userId = req.session.userId;
  res.render('weather', { userId: userId });
});

app.get('/calendar', (req, res) => {
  const userId = req.session.userId;
  res.render('calendar', { userId: userId });
});

app.get('/planner', (req, res) => {
  const userId = req.session.userId; 
  res.render('planner', { userId: userId });  
});


// Registration Route
app.get('/register', (req, res) => {
  const userId = req.session.userId || null; // If no userId, set it to null
  res.render('register', { userId: userId });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).render('register', { title: 'Register!', error: 'Username and password are required.' });
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
      return res.status(400).render('register', { title: 'Register!', error: 'Username already exists.' });
  }

    const hashedPassword = await bcrypt.hash(password, 10);
  
    const newUser = new User({ username, password: hashedPassword });
  
    // Save the user
    try {
      await newUser.save();
      res.status(201).redirect('/'); // 201 Created status
  } catch (err) {
      res.status(500).render('register', { title: 'Register!', error: 'Error registering user. Please try again.' });
  }
}); 
  
// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id; // Store userId in session
      res.redirect('/planner');
    } else {
      res.status(401).render('index', { title: 'Login', error: 'Invalid credentials' }); 
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('index', { title: 'Login', error: 'Server error' });
  }
});
  
// Logout Route
app.get('/logout', (req, res) => {
  const userId = req.session.userId;
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Failed to log out');
    }
    res.render('logout', { userId: userId }); 
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/'); // Redirect to homepage after logging out
  });
});
  

// Middleware to authenticate user
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
      return next();
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }
  
// Get Events Route
app.get('/get-events', async (req, res) => {
  const userId = req.session.userId; // Use session to get the user ID
  
  // If the user is not logged in, return an empty array
  if (!userId) {
    return res.json([]);  // No events for non-logged-in users
  }

  try {
    const events = await Event.find({ userId });  // Fetch events for the logged-in user
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
});

// Add Event Route
app.post('/add-event', async (req, res) => {
  const { title, start, end, allDay } = req.body;

  // Get user ID from the session
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const newEvent = new Event({
      title,
      start,
      end,
      allDay,
      userId // Use the userId from the session
  });

  try {
      const savedEvent = await newEvent.save();
      res.json({ success: true, event: savedEvent });
  } catch (err) {
      console.error('Error saving event:', err);
      res.status(500).json({ success: false, message: 'Error saving event' });
  }
});
  
// Delete Event route
app.delete('/delete-event/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId; // Get user ID from the session

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid event ID' });
  }

  try {
    // Find the event by ID and userId to ensure it belongs to the logged-in user
    const event = await Event.findOneAndDelete({ _id: id, userId });

    if (event) {
      res.json({ success: true, message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Event not found or not authorized to delete' });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});