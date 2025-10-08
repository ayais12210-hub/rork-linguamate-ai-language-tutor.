Feature: Application Smoke Tests
  As a user of the language learning application
  I want the basic functionality to work correctly
  So that I can access and use the core features without issues

  Background:
    Given I am accessing the application

  Scenario: Application Loads Successfully
    When I navigate to the home page
    Then the application should load completely
    And the main user interface should be visible
    And the page should be functional

  Scenario: Navigate to Lessons Tab
    When I navigate to the home page
    And I click on the "Lessons" tab
    Then I should be taken to the lessons page
    And the URL should contain "lessons"
    And the lessons page should load correctly

  Scenario: Basic Navigation Works
    When I navigate to the home page
    Then I should see the main navigation elements
    And I should be able to click on navigation tabs
    And the navigation should respond to clicks

  Scenario: Page Content Displays
    When I navigate to any page
    Then the page content should be visible
    And text should be readable
    And images should load properly

  Scenario: Interactive Elements Respond
    When I navigate to any page with interactive elements
    Then buttons should be clickable
    And forms should be functional
    And links should work properly

  Scenario: Application Handles Basic User Input
    When I interact with input fields
    Then I should be able to type text
    And the input should be accepted
    And the interface should respond appropriately

  Scenario: Error Handling Works
    When I perform an action that might cause an error
    Then the application should handle the error gracefully
    And I should see appropriate error messages
    And the application should not crash

  Scenario: Mobile Responsiveness
    Given I am using a mobile device
    When I navigate to the application
    Then the interface should be mobile-friendly
    And content should be properly sized
    And navigation should work on mobile

  Scenario: Cross-Browser Compatibility
    Given I am using a supported web browser
    When I navigate to the application
    Then the application should work correctly
    And all features should be accessible
    And the interface should display properly

Note: Smoke tests verify that the application's core functionality works correctly and can be used for basic regression testing.