const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());

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
  action: String,
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

// مسیر برای دریافت تنظیمات
app.post('/get_config', (req, res) => {
  const configData = req.body;
  const fileName = `${configData.file_name}.json`;

  fs.writeFile(path.join(__dirname, fileName), JSON.stringify(configData, null, 4), (err) => {
    if (err) {
      console.error(`Error saving configuration: ${err}`);
      return res.status(500).send(`Error saving configuration: ${err.message}`);
    }
    res.status(200).send({ message: `Configuration saved successfully as ${fileName}!` });
  });
});

// مسیر برای آپلود فایل JSON
const uploadDir = path.join(__dirname, 'uploads');

// بررسی و ایجاد پوشه اگر وجود ندارد
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.post('/upload_config', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const file = req.files.file;
  const uploadPath = path.join(uploadDir, file.name);

  file.mv(uploadPath, (err) => {
    if (err) {
      console.error(`Error uploading file: ${err}`);
      return res.status(500).json({ error: `Error uploading file: ${err.message}` });
    }
    res.status(200).json({ message: 'Configuration uploaded successfully!' });
  });
});

// مسیر برای اجرای کرالر
app.post('/run-crawler', (req, res) => {
  if (!req.files || !req.files.config_file) {
    return res.status(400).json({ error: 'No configuration file was uploaded.' });
  }

  const file = req.files.config_file;
  const uploadPath = path.join(uploadDir, file.name);

  file.mv(uploadPath, (err) => {
    if (err) {
      console.error(`Error uploading file: ${err}`);
      return res.status(500).json({ error: `Error uploading file: ${err.message}` });
    }

    const { output_directory, depth } = req.body;

    const scriptPath = path.join(__dirname, '../ex/web_crawler_mongo.py');

    exec(`python "${scriptPath}" --config "${uploadPath}" --directory "${output_directory}" --depth ${depth}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing crawler: ${error}`);
        return res.status(500).json({ error: `Error executing crawler: ${error.message}` });
      }
      if (stderr) {
        console.error(`Crawler stderr: ${stderr}`);
        return res.status(500).json({ error: `Crawler stderr: ${stderr}` });
      }

      res.status(200).json({ message: 'Crawler executed successfully.', output: stdout });
    });
  });
});



app.post('/run-tests', (req, res) => {
  if (!req.files || !req.files.test_file) {
    return res.status(400).json({ error: 'No test file was uploaded.' });
  }

  const file = req.files.test_file;
  const uploadPath = path.resolve(uploadDir, file.name); // استفاده از path.resolve

  file.mv(uploadPath, (err) => {
    if (err) {
      console.error(`Error uploading file: ${err}`);
      return res.status(500).json({ error: `Error uploading file: ${err.message}` });
    }

    const scriptPath = path.resolve(__dirname, '../test_ex/test_program/main.py'); // مسیر اسکریپت را تصحیح کن

    // چاپ مسیرها برای بررسی
    console.log("Script Path:", scriptPath);
    console.log("Upload Path:", uploadPath);

    // اجرای فایل Python با نقل‌قول مناسب
    exec(`python "${scriptPath}" "${uploadPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing test: ${error}`);
        return res.status(500).json({ error: `Error executing test: ${error.message}` });
      }
      if (stderr) {
        console.error(`Test stderr: ${stderr}`);
        return res.status(500).json({ error: `Test stderr: ${stderr}` });
      }

      res.status(200).json({ message: 'Tests executed successfully.', output: stdout });
    });
  });
});


// شروع سرور
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});