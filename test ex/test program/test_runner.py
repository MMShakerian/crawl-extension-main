from action_handler import ActionHandler
import time

class TestRunner:
    def __init__(self, driver):
        self.driver = driver

    def run_test(self, scenario):
        self.driver.get(scenario["url"])
        print(f"Opened URL: {scenario['url']}")
        
        action_handler = ActionHandler(self.driver)
        for action in scenario["actions"]:
            action_handler.perform_action(action)
        
        time.sleep(2)
        
        print("Test completed successfully.")