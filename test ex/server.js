const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// مسیر برای اجرای فایل main.py
app.post('/run-tests', (req, res) => {
  const { fileContent } = req.body;
  const tempFilePath = path.join(__dirname, 'temp.json');

  fs.writeFile(tempFilePath, fileContent, (err) => {
    if (err) {
      console.error(`Error writing temp file: ${err}`);
      return res.status(500).send(`Error writing temp file: ${err.message}`);
    }

    exec(`python "C:\\Users\\mohmmad moein\\Desktop\\crawl-extension-main\\test ex\\test program\\main.py" "${tempFilePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error}`);
        return res.status(500).send(`Error executing script: ${error.message}`);
      }
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
        return res.status(500).send(`Script stderr: ${stderr}`);
      }
      console.log(`Script stdout: ${stdout}`);
      res.status(200).send(`Script executed successfully: ${stdout}`);
    });
  });
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});