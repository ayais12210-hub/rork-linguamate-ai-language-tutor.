Feature: User Authentication
  As a user of the language learning application
  I want to log in and create an account
  So that I can access my personalized learning progress and settings

  Background:
    Given I am not logged in to the application

  Scenario: Access Login Page
    When I navigate to the login page
    Then I should see the login form
    And the page should be fully loaded and visible

  Scenario: Access Signup Page
    When I navigate to the signup page
    Then I should see the signup form
    And the page should be fully loaded and visible

  Scenario: Login with Valid Credentials
    Given I am on the login page
    When I enter my email address
    And I enter my password
    And I click the "Login" button
    Then I should be successfully logged in
    And I should be redirected to the main dashboard

  Scenario: Login with Invalid Credentials
    Given I am on the login page
    When I enter an invalid email address
    And I enter an incorrect password
    And I click the "Login" button
    Then I should see an error message
    And I should remain on the login page

  Scenario: Create New Account
    Given I am on the signup page
    When I enter a valid email address
    And I enter a secure password
    And I confirm my password
    And I click the "Create Account" button
    Then I should see a success message
    And I should be redirected to the onboarding flow

  Scenario: Create Account with Existing Email
    Given I am on the signup page
    And an account already exists with the email "test@example.com"
    When I enter "test@example.com" as my email
    And I enter a password
    And I click the "Create Account" button
    Then I should see an error message about email already existing
    And I should remain on the signup page

  Scenario: Password Validation
    Given I am on the signup page
    When I enter a weak password
    And I click the "Create Account" button
    Then I should see password requirements
    And the requirements should specify minimum length and complexity

  Scenario: Navigate Between Login and Signup
    Given I am on the login page
    When I click the "Create Account" link
    Then I should be taken to the signup page
    And I should see the signup form

  Scenario: Navigate from Signup to Login
    Given I am on the signup page
    When I click the "Already have an account?" link
    Then I should be taken to the login page
    And I should see the login form

  Scenario: Logout from Application
    Given I am logged in to the application
    When I click the logout button
    Then I should be logged out
    And I should be redirected to the login page

  Scenario: Remember Me Functionality
    Given I am on the login page
    When I check the "Remember Me" checkbox
    And I enter my credentials
    And I click the "Login" button
    Then I should be logged in
    And my session should persist across browser sessions

  Scenario: Forgot Password Flow
    Given I am on the login page
    When I click the "Forgot Password?" link
    Then I should be taken to the password reset page
    And I should see a form to enter my email address

  Scenario: Reset Password with Valid Email
    Given I am on the password reset page
    When I enter my registered email address
    And I click the "Send Reset Link" button
    Then I should see a confirmation message
    And the message should indicate that reset instructions were sent

  Scenario: Reset Password with Invalid Email
    Given I am on the password reset page
    When I enter an unregistered email address
    And I click the "Send Reset Link" button
    Then I should see an error message
    And the message should indicate the email is not registered

Note: All authentication tests should be performed in a test environment with test user accounts to avoid affecting production data.