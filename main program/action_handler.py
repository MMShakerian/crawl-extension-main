from selenium.webdriver.common.by import By
from selenium.common.exceptions import UnexpectedAlertPresentException
from validator import Validator
from alert_handler import AlertHandler
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from logger import Logger  # ایمپورت کلاس Logger

class ActionHandler:
    def __init__(self, driver):
        self.driver = driver
        self.logger = Logger(driver)  # مقداردهی Logger با ارسال driver

    def perform_action(self, action):
        selector = action["selector"]

        if action["action"] == "input":
            self.handle_input_action(action)
        elif action["action"] == "click":
            self.handle_click_action(selector)

    def handle_input_action(self, action):
        selector = action["selector"]
        try:
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            self.logger.log(f"Found element for selector '{selector}'", selector)

            if "rules" in action:
                expected_error_selectors = action.get("expected_error_selector")
                expected_error = action.get("expected_error")

                self.logger.log(f"Starting invalid values test for selector '{selector}'", selector)

                Validator(self.driver).test_invalid_values(selector, action["rules"], expected_error_selectors, expected_error)

                self.driver.find_element("css selector", "body").click()
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)

                if isinstance(expected_error_selectors, list):
                    error_displayed = False
                    for error_selector in expected_error_selectors:
                        try:
                            WebDriverWait(self.driver, 30).until(
                                EC.visibility_of_element_located((By.CSS_SELECTOR, error_selector))
                            )
                            self.logger.log(f"Expected error message for selector '{error_selector}' is displayed.", error_selector)
                            error_displayed = True
                            break
                        except:
                            self.logger.log(f"Expected error message for selector '{error_selector}' is NOT displayed.", error_selector)

                    if not error_displayed:
                        self.logger.log("No expected error messages were displayed.")
                else:
                    try:
                        WebDriverWait(self.driver, 30).until(
                            EC.visibility_of_element_located((By.CSS_SELECTOR, expected_error_selectors))
                        )
                        self.logger.log(f"Expected error message for selector '{expected_error_selectors}' is displayed.",expected_error_selectors)
                    except:
                        self.logger.log(f"Expected error message for selector '{expected_error_selectors}' is NOT displayed.",expected_error_selectors)

                self.logger.log(f"Completed invalid values test for selector '{selector}'", selector)

            element.clear()
            self.logger.log(f"Cleared field for selector '{selector}'", selector)
            element.send_keys(action["value"])
            self.logger.log(f"Entered '{action['value']}' in field with selector '{selector}'", selector)
            time.sleep(1)

        except UnexpectedAlertPresentException:
            AlertHandler(self.driver).handle_alert(selector)
        except Exception as e:
            self.logger.log(f"Error in input action for selector {selector}: {e}", selector)

    def handle_click_action(self, selector):
        try:
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            self.logger.log(f"Found element for click action with selector '{selector}'", selector)
            element.click()
            self.logger.log(f"Clicked on element with selector '{selector}'", selector)
        except UnexpectedAlertPresentException:
            AlertHandler(self.driver).handle_alert(selector)
        except Exception as e:
            self.logger.log(f"Error in click action for selector {selector}: {e}", selector)
