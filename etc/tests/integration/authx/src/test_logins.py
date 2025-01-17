from selenium import webdriver
from selenium.webdriver.common.keys import Keys

import os
import unittest
import time
import requests
import pytest


# -- helper functions --

def login(driver, username, password):
    # ensure we were redirected
    assert "Log in to candig" in driver.title

    username_input = driver.find_elements_by_xpath("//*[@id='username']")[0]
    password_input = driver.find_elements_by_xpath("//*[@id='password']")[0]

    login_button = driver.find_elements_by_xpath("//*[@id='kc-login']")[0]

    username_input.send_keys(username)
    password_input.send_keys(password)

    login_button.click()

# -- - --


@pytest.mark.usefixtures("setup")
class TestLogins():
    
    def test_login_user1(self):
        self.driver.get(self.candig_url)

        # credentials
        u1 = os.environ["KEYCLOAK_TEST_USER"]
        #TODO: fix , retrieve PW from secret file instead of env
        p1 = os.environ["KEYCLOAK_TEST_PW"]
        login(self.driver, u1, p1)
        
        time.sleep(self.debug_pause_time_seconds)

        # verify successful login
        assert "Dashboard" in self.driver.title



    def test_login_bogus_user(self):
        self.driver.get(self.candig_url)

        # credentials
        username = "nobody"
        password = "jibberishPassword123$$$$"
        login(self.driver, username, password)

        time.sleep(self.debug_pause_time_seconds)

        # verify invalid login
        assert "Invalid username or password." in self.driver.find_elements_by_xpath("//*[@id='kc-content-wrapper']/div[1]")[0].text

