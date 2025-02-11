import json
import os
import sys
from selenium import webdriver
from test_runner import TestRunner
from logger import Logger

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <path_to_json_file>")
        exit()

    json_file_path = sys.argv[1]

    if not os.path.exists(json_file_path):
        print(f"File not found: {json_file_path}")
        exit()

    # مقداردهی منابع
    driver = webdriver.Chrome()
    logger = Logger(driver)  # ارسال driver به Logger
    test_runner = TestRunner(driver)

    try:
        # اجرای تست برای فایل JSON
        print(f"Running test for file: {json_file_path}")

        with open(json_file_path, "r") as file:
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
