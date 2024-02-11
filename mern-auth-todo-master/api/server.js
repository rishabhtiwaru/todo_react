import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Todo from './models/Todo.js';

const secret = 'secret123';

// Connect to MongoDB
mongoose.connect('mongodb+srv://rishabhtiwary332:rishabht987@cluster0.ghpaxm9.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const app = express();

// Middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000'
}));

// Routes
app.get('/', (req, res) => {
  res.send('OK');
});

// Register User
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });

    const userInfo = await user.save();
    const token = jwt.sign({ id: userInfo._id, email: userInfo.email }, secret);
    
    res.cookie('token', token, { httpOnly: true }).json({ id: userInfo._id, email: userInfo.email });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login User
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userInfo = await User.findOne({ email });

    if (!userInfo || !bcrypt.compareSync(password, userInfo.password)) {
      return res.sendStatus(401);
    }

    const token = jwt.sign({ id: userInfo._id, email: userInfo.email }, secret);

    res.cookie('token', token, { httpOnly: true }).json({ id: userInfo._id, email: userInfo.email });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout User
app.post('/logout', (req, res) => {
  res.clearCookie('token').sendStatus(200);
});

// Get User Info
app.get('/user', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({});
    }

    const payload = jwt.verify(token, secret);
    const userInfo = await User.findById(payload.id);

    if (!userInfo) {
      return res.json({});
    }

    res.json({ id: userInfo._id, email: userInfo.email });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Handle JWT token errors for '/todos' routes
const handleTokenError = (res, err) => {
  console.error(err);
  res.sendStatus(401); // Unauthorized
};

// Get Todos
app.get('/todos', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.sendStatus(401); // Unauthorized
    }

    const payload = jwt.verify(token, secret);
    const todos = await Todo.find({ user: payload.id });

    res.json(todos);
  } catch (err) {
    handleTokenError(res, err);
  }
});

// Create Todo
app.put('/todos', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.sendStatus(401); // Unauthorized
    }

    const payload = jwt.verify(token, secret);

    const todo = new Todo({
      text: req.body.text,
      done: false,
      user: payload.id
    });

    const savedTodo = await todo.save();
    res.json(savedTodo);
  } catch (err) {
    handleTokenError(res, err);
  }
});

// Update Todo
app.post('/todos', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.sendStatus(401); // Unauthorized
    }

    const payload = jwt.verify(token, secret);

    await Todo.updateOne(
      { _id: req.body.id, user: payload.id },
      { done: req.body.done }
    );

    res.sendStatus(200);
  } catch (err) {
    handleTokenError(res, err);
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
