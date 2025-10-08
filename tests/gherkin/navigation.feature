Feature: Application Navigation
  As a user of the language learning application
  I want to navigate between different sections of the app
  So that I can access all features and content easily

  Background:
    Given I am on the home page
    And the application has loaded completely

  Scenario: Navigate Between Main Tabs
    When I click on the "Learn" tab
    Then I should be taken to the learn page
    And the URL should contain "learn"

  Scenario: Navigate to Lessons Tab
    When I click on the "Lessons" tab
    Then I should be taken to the lessons page
    And the URL should contain "lessons"

  Scenario: Navigate to Modules Tab
    When I click on the "Modules" tab
    Then I should be taken to the modules page
    And the URL should contain "modules"

  Scenario: Navigate to Chat Tab
    When I click on the "Chat" tab
    Then I should be taken to the chat page
    And the URL should contain "chat"

  Scenario: Navigate to Profile Tab
    When I click on the "Profile" tab
    Then I should be taken to the profile page
    And the URL should contain "profile"

  Scenario: Complete Tab Navigation Flow
    Given I am on the home page
    When I navigate through all available tabs
    Then I should be able to access each tab successfully
    And each tab should load its content properly
    And the navigation should be smooth

  Scenario: Tab Visibility and Availability
    When I view the navigation bar
    Then I should see all main navigation tabs
    And the tabs should be clearly labeled
    And the tabs should be easily clickable

  Scenario: Active Tab Indication
    Given I am on the learn page
    When I view the navigation bar
    Then the "Learn" tab should appear active or selected
    And other tabs should appear inactive

  Scenario: Navigation State Persistence
    Given I am on the lessons page
    When I refresh the page
    Then I should remain on the lessons page
    And the navigation state should be preserved

  Scenario: Deep Link Navigation
    Given I have a direct link to the translator page
    When I navigate to that link
    Then I should be taken directly to the translator page
    And the page should load correctly
    And the navigation should reflect the current location

  Scenario: Back Button Navigation
    Given I am on the learn page
    When I navigate to the lessons page
    And I use the browser back button
    Then I should return to the learn page
    And the navigation state should be correct

  Scenario: Navigation with Authentication
    Given I am not logged in
    When I try to navigate to a protected page
    Then I should be redirected to the login page
    And after logging in, I should be taken to the intended page

  Scenario: Mobile Navigation
    Given I am using a mobile device
    When I view the navigation
    Then the navigation should be touch-friendly
    And tabs should be appropriately sized for mobile
    And navigation should work with touch gestures

  Scenario: Navigation Accessibility
    When I navigate using keyboard only
    Then I should be able to access all navigation tabs
    And focus should be clearly visible
    And navigation should work with screen readers

  Scenario Outline: Navigate to Different Sections
    When I click on the "<tab_name>" tab
    Then I should be taken to the "<tab_name>" page
    And the URL should contain "<expected_url>"

    Examples:
      | tab_name | expected_url |
      | Learn    | learn        |
      | Lessons  | lessons      |
      | Modules  | modules      |
      | Chat     | chat         |
      | Profile  | profile      |

Note: Navigation tests should verify both visual navigation elements and URL routing to ensure complete functionality.