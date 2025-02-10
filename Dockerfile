# استفاده از یک ایمیج پایه Python
FROM python:3.9-slim

# تنظیم دایرکتوری کاری در داخل کانتینر
WORKDIR /app

# کپی کردن فایل requirements.txt
COPY requirements.txt .

# نصب وابستگی‌ها
RUN pip install --no-cache-dir -r requirements.txt

# کپی کردن بقیه فایل‌های پروژه به کانتینر
COPY . .

# باز کردن پورت مورد استفاده برنامه
EXPOSE 5000

# دستور برای اجرای برنامه
CMD ["python", "app.py"]
