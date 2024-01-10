
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://hrishabh1800:uIzYLsK2d1ClpixB@cluster0.xu6y95e.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define user schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(user.password, salt);
  user.password = hashedPassword;
  next();
});

// Model
const User = mongoose.model('User', userSchema);

const contactSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
});

// Model
const Contact = mongoose.model('Contact', contactSchema);

// Middleware for parsing JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session middleware
app.use(session({
  secret: 'your-secret-key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve HTML file
app.get('/', (req, res) => {
  if (req.session.isAuth) {
    res.redirect('/home');
  } else {
    res.sendFile(__dirname + '/login.html');
  }
});

// Register endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();

    // Set session variable to indicate authentication
    req.session.isAuth = true;

    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).send('Invalid username or password');
    }

    // Set session variable to indicate authentication
    req.session.isAuth = true;

    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/contactt', async (req, res) => {
  try {
    const { fname, lname, email, message } = req.body;

    // Create a new Contact instance
    const newContact = new Contact({
      fname,
      lname,
      email,
      message,
    });

    // Save the contact form data to MongoDB
    await newContact.save();

    res.send('Form data submitted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Home page (protected route)
app.get('/home', (req, res) => {
  if (req.session.isAuth) {
    res.sendFile(__dirname + '/homepage.html');
  } else {
    res.redirect('/');
  }
});

app.get('/newuser', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/contact.html');
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
