import json
import os
from selenium import webdriver
from test_runner import TestRunner
from logger import Logger

# مسیر فولدر حاوی فایل‌های JSON را مشخص کنید
json_folder = "C:/Users/mohmmad moein/Desktop/crawl-extension-main/main program"

if __name__ == "__main__":
    # گرفتن لیست فایل‌های JSON در فولدر
    json_files = [file for file in os.listdir(json_folder) if file.endswith(".json")]
    
    if not json_files:
        print("No JSON files found in the specified folder.")
        exit()

    # مقداردهی منابع
    driver = webdriver.Chrome()
    logger = Logger(driver)  # ارسال driver به Logger
    test_runner = TestRunner(driver)

    try:
        # اجرای تست برای هر فایل JSON
        for json_file in json_files:
            file_path = os.path.join(json_folder, json_file)
            print(f"Running test for file: {json_file}")

            with open(file_path, "r") as file:
                scenario = json.load(file)

            test_runner.run_test(scenario)

    except Exception as e:
        # ثبت خطا در صورت بروز مشکل
        logger.log(f"An error occurred during testing: {e}")
    finally:
        # بستن منابع
        logger.close()
        driver.quit()
        print("Driver and Logger closed successfully.")
