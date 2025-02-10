from pymongo import MongoClient
from datetime import datetime  # برای استفاده از تاریخ و زمان


class Logger:
    def __init__(self, driver, db_url="mongodb://localhost:27017/", db_name="logsDB10", collection_name="logs"):
        self.driver = driver  # دریافت driver از Selenium
        self.client = MongoClient(db_url)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def log(self, message, selector=None):
        # گرفتن آدرس URL فعلی از Selenium
        current_url = self.driver.current_url

        print(f"{message} | Selector: {selector} | URL: {current_url}")

        # ذخیره در MongoDB
        log_entry = {
            "message": message,
            "selector": selector,
            "url": current_url,  # اضافه کردن URL
            "timestamp": datetime.now()  # اضافه کردن زمان کنونی
        }

        self.collection.insert_one(log_entry)

    def close(self):
        self.client.close()
