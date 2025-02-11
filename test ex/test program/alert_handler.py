from selenium.common.exceptions import NoAlertPresentException
from logger import Logger  # ایمپورت Logger

class AlertHandler:
    def __init__(self, driver):
        self.driver = driver
        self.logger = Logger()  # مقداردهی Logger

    def handle_alert(self, selector):
        try:
            alert = self.driver.switch_to.alert
            alert_text = alert.text
            alert.accept()
            self.logger.log(f"Handled alert with message: {alert_text} for field with selector '{selector}'")
            print(f"Handled alert with message: {alert_text} for field with selector '{selector}'")
        except NoAlertPresentException:
            pass
