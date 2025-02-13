import os
import time
import json
import csv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from pymongo import MongoClient
import argparse

# تنظیم آرگومان‌های خط فرمان
parser = argparse.ArgumentParser(description="Web Crawler and Data Extractor")
parser.add_argument('--directory', type=str, help="Directory to save outputs")
parser.add_argument('--config', type=str, help="Path to JSON configuration file")
parser.add_argument('--depth', type=int, default=2, help="Crawling depth (default: 2)")
args = parser.parse_args()

# بررسی و بارگذاری فایل JSON
config_data = {}
if args.config:
    try:
        with open(args.config, 'r') as json_file:
            config_data = json.load(json_file)
            print(f"Loaded configuration from {args.config}")
    except Exception as e:
        print(f"Error loading configuration file: {e}")
        exit(1)

# استخراج مقادیر از فایل JSON یا آرگومان‌های خط فرمان
db_name = config_data.get("db_name")
collection_name = config_data.get("collection_name")
url = config_data.get("url")

# بررسی وجود مقادیر ضروری
if not db_name or not collection_name or not url:
    print("Error: Missing required configuration (db_name, collection_name, url).")
    exit(1)

# تنظیم دایرکتوری خروجی
output_directory = args.directory or os.getcwd()
if not os.path.exists(output_directory):
    os.makedirs(output_directory)

# اتصال به MongoDB
client = MongoClient()  # به سرور پیش‌فرض localhost متصل می‌شود
db = client[db_name]
collection = db[collection_name]

# تابع برای استخراج تمام لینک‌های یک صفحه وب
def get_all_links(driver, url):
    driver.get(url)
    time.sleep(1)  # صبر برای بارگذاری صفحه
    links = driver.find_elements(By.TAG_NAME, "a")
    return [link.get_attribute("href") for link in links if link.get_attribute("href") and link.get_attribute("href").startswith("http")]

# تابع جاوااسکریپت برای استخراج XPath یک المان
def get_xpath(driver, element):
    return driver.execute_script(
        """
        function getXPath(element) {
            if (element.id !== '') {
                return 'id("' + element.id + '")';
            }
            if (element === document.body) {
                return element.tagName;
            }

            var ix = 0;
            var siblings = element.parentNode.childNodes;
            for (var i = 0; i < siblings.length; i++) {
                var sibling = siblings[i];
                if (sibling === element) {
                    return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
                }
                if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                    ix++;
                }
            }
        }
        return getXPath(arguments[0]);
        """,
        element
    )

# استخراج المان‌های تعاملی از یک صفحه وب
def extract_form_elements(driver, url, collection, csv_writer):
    driver.get(url)
    time.sleep(1)

    elements = [
        ("input/textarea", driver.find_elements(By.XPATH, "//input[@type='text'] | //textarea")),
        ("button", driver.find_elements(By.XPATH, "//button | //input[@type='submit'] | //input[@type='button']")),
        ("select", driver.find_elements(By.XPATH, "//select")),
        ("checkbox", driver.find_elements(By.XPATH, "//input[@type='checkbox']")),
        ("radio button", driver.find_elements(By.XPATH, "//input[@type='radio']")),
        ("clickable", driver.find_elements(By.XPATH, "//*[@onclick] | //a"))
    ]

    for element_type, elements_list in elements:
        for element in elements_list:
            element_info = {
                "element_type": element_type,
                "tag_name": element.tag_name,
                "xpath": get_xpath(driver, element),
                "location": element.location,
                "size": element.size,
                "placeholder": element.get_attribute("placeholder"),
                "url": url
            }

            # ذخیره در MongoDB
            collection.insert_one(element_info)

            # ذخیره در CSV
            csv_writer.writerow(element_info.values())

# پیمایش لینک‌ها و ساخت گراف لینک‌ها
def crawl_links(driver, root_url, depth):
    visited = set()
    graph = {}

    def crawl(url, current_depth):
        if url in visited or current_depth == 0:
            return
        visited.add(url)

        try:
            links = get_all_links(driver, url)
            graph[url] = links
            for link in links:
                crawl(link, current_depth - 1)
        except Exception as e:
            print(f"Error crawling {url}: {e}")

    crawl(root_url, depth)
    return graph

# اجرای برنامه اصلی
def main():
    # تنظیمات Selenium
    service = Service()
    driver = webdriver.Chrome(service=service)

    # ایجاد فایل CSV
    output_csv = os.path.join(output_directory, "interactive_elements.csv")
    with open(output_csv, mode='w', newline='', encoding='utf-8') as file:
        csv_writer = csv.writer(file)
        csv_writer.writerow(["Element Type", "Tag Name", "XPath", "Location", "Size", "Placeholder", "URL"])

        # استخراج لینک‌ها
        print("Crawling links...")
        graph = crawl_links(driver, url, args.depth)

        # استخراج المان‌های تعاملی
        print("Extracting interactive elements...")
        for page in graph.keys():
            extract_form_elements(driver, page, collection, csv_writer)

    driver.quit()
    print(f"Data extraction completed. Results saved to {output_csv} and MongoDB.")

if __name__ == "__main__":
    main()
