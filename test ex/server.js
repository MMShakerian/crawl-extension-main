const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// اتصال به MongoDB
mongoose.connect('mongodb://localhost:27017/userActions', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// تعریف یک schema برای اقدامات کاربر
const actionSchema = new mongoose.Schema({
  actionType: String,
  selector: String,
  label: String,
  timestamp: String,
  url: String,
  value: String,
  invalid_values: [String],
  error_message: String,
  rules: {
    max_length: Number,
    contains_digits: Boolean,
    allowed_characters: String,
  },
});

const Action = mongoose.model('Action', actionSchema);

// مسیر برای ذخیره اقدامات
app.post('/actions', async (req, res) => {
  try {
    const { actionType, selector, value, invalid_values, rules } = req.body;
    if (actionType === 'input') {
      // پیدا کردن اقدام موجود با استفاده از selector
      let action = await Action.findOne({ selector, actionType });
      if (action) {
        // اضافه کردن مقدار جدید به اقدام موجود
        action.value = value;
        action.invalid_values = invalid_values;
        action.rules = rules;
        action.timestamp = new Date().toISOString();
      } else {
        // ایجاد اقدام جدید اگر پیدا نشد
        action = new Action(req.body);
      }
      await action.save();
      res.status(201).send(action);
    } else {
      const action = new Action(req.body);
      await action.save();
      res.status(201).send(action);
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// مسیر برای دریافت تمامی اقدامات
app.get('/actions', async (req, res) => {
  try {
    const actions = await Action.find({});
    res.status(200).send(actions);
  } catch (error) {
    res.status(500).send(error);
  }
});

// مسیر برای دانلود اقدامات به صورت JSON
app.get('/actions/download', async (req, res) => {
  try {
    const actions = await Action.find({});
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=user_actions.json');
    res.send(JSON.stringify(actions, null, 2));
  } catch (error) {
    res.status(500).send(error);
  }
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});