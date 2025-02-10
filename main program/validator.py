from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoAlertPresentException, UnexpectedAlertPresentException
from alert_handler import AlertHandler
import time
from logger import Logger  # ایمپورت کلاس Logger

class Validator:
    def __init__(self, driver):
        self.driver = driver
        self.logger = Logger()  # مقداردهی Logger

    def test_invalid_values(self, selector, rules, expected_error_selector=None, expected_error=None):
        invalid_values = self.generate_invalid_values(rules)
        for invalid_value in invalid_values:
            try:
                element = self.driver.find_element(By.CSS_SELECTOR, selector)
                element.clear()
                element.send_keys(invalid_value)
                time.sleep(1)
                self.logger.log(f"Testing invalid value '{invalid_value}' for field with selector '{selector}'")
                print(f"Testing invalid value '{invalid_value}' for field with selector '{selector}'")
                
                self.driver.find_element(By.TAG_NAME, "body").click()
                time.sleep(0.5)
                
                if expected_error_selector:
                    self.check_error_message(selector, expected_error_selector, expected_error)
                else:
                    self.check_invalid_value(selector, invalid_value)
                
            except UnexpectedAlertPresentException:
                self.handle_alert(selector)
            except Exception as e:
                print(f"Error testing invalid value '{invalid_value}' for selector {selector}: {e}")
                self.logger.log(f"Error testing invalid value '{invalid_value}' for selector {selector}: {e}")

    def handle_alert(self, selector):
        try:
            alert = self.driver.switch_to.alert
            alert_text = alert.text
            alert.accept()
            self.logger.log(f"Alert handled for selector '{selector}' with message: {alert_text}")
            print(f"Alert handled for selector '{selector}' with message: {alert_text}")
        except NoAlertPresentException:
            self.logger.log(f"No alert present for selector '{selector}'")
            print(f"No alert present for selector '{selector}'")

    def check_error_message(self, selector, error_selector, expected_error):
        try:
            error_element = self.driver.find_element(By.CSS_SELECTOR, error_selector)
            error_text = error_element.text
            self.logger.log(f"Error message shown for selector '{selector}': {error_text}")
            print(f"Error message shown for selector '{selector}': {error_text}")
            
            if expected_error and expected_error in error_text:
                self.logger.log(f"Field with selector '{selector}' correctly displayed expected error: '{expected_error}'")
                print(f"Field with selector '{selector}' correctly displayed expected error: '{expected_error}'")
            else:
                self.logger.log(f"Error message for selector '{selector}' did not match expected error.")
                print(f"Error message for selector '{selector}' did not match expected error.")
        
        except Exception:
            self.logger.log(f"Error message element with selector '{error_selector}' not found for field '{selector}'.")
            print(f"Error message element with selector '{error_selector}' not found for field '{selector}'.")

    def check_invalid_value(self, selector, invalid_value):
        try:
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            if element.get_attribute("value") == invalid_value:
                self.logger.log(f"Warning: Field with selector '{selector}' accepted invalid value '{invalid_value}'")
                print(f"Warning: Field with selector '{selector}' accepted invalid value '{invalid_value}'")
            else:
                self.logger.log(f"Field with selector '{selector}' correctly rejected invalid value '{invalid_value}'")
                print(f"Field with selector '{selector}' correctly rejected invalid value '{invalid_value}'")
        
        except Exception as e:
            print(f"Error checking invalid value for selector {selector}: {e}")
            self.logger.log(f"Error checking invalid value for selector {selector}: {e}")

    def generate_rule_based_invalid_values(self, rules):
        # مقادیر نامعتبر بر اساس قوانین مشخص شده
        rule_based_invalid_values = []

        if rules:
            if "max_length" in rules:
                rule_based_invalid_values.append("a" * (rules["max_length"] + 1))

            if "contains_digits" in rules and not rules["contains_digits"]:
                rule_based_invalid_values.append("1234")

            if "allowed_characters" in rules:
                if rules["allowed_characters"] == "^[a-zA-Z]+$":
                    rule_based_invalid_values.append("!@#$%^&*()")

        return rule_based_invalid_values

    def generate_general_invalid_values(self):
        # مقادیر نامعتبر عمومی که همیشه باید بررسی شوند
        general_invalid_values = ["abcdefghij", "!@#$%^&*()", "1234abcd"]
        return general_invalid_values

    def generate_invalid_values(self, rules):
        # ترکیب مقادیر نامعتبر بر اساس قوانین و مقادیر عمومی
        invalid_values = self.generate_rule_based_invalid_values(rules)
        invalid_values.extend(self.generate_general_invalid_values())
        return invalid_values

