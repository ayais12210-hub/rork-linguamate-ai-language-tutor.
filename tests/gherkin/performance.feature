Feature: Application Performance
  As a user of the language learning application
  I want the application to load quickly and respond efficiently
  So that I can have a smooth and responsive learning experience

  Background:
    Given I am accessing the application
    And I have a stable internet connection

  Scenario: Page Load Performance
    When I navigate to the home page
    Then the page should load completely within 3 seconds
    And all network requests should finish
    And the page should be fully interactive

  Scenario: Core Web Vitals - Largest Contentful Paint
    When I navigate to the home page
    Then the largest contentful paint should occur within 2.5 seconds
    And the main content should be visible quickly
    And the visual loading should be smooth

  Scenario: Core Web Vitals - Cumulative Layout Shift
    When I navigate to the home page
    Then the cumulative layout shift should be less than 0.1
    And the page layout should remain stable
    And content should not jump around during loading

  Scenario: Core Web Vitals - First Input Delay
    When I navigate to the home page
    And I interact with the page for the first time
    Then the first input delay should be less than 100 milliseconds
    And the page should respond immediately to user input
    And there should be no noticeable lag

  Scenario: Image Loading Efficiency
    When I navigate to any page with images
    Then all images should have lazy loading enabled
    And images should load only when needed
    And the page should not be blocked by image loading

  Scenario: Optimized Bundle Size
    When I navigate to the home page
    Then the initial page size should be under 1 megabyte
    And the JavaScript bundle should be optimized
    And unnecessary resources should not be loaded

  Scenario: Concurrent Request Handling
    When I navigate to the home page
    And multiple requests are made simultaneously
    Then all requests should complete within 2 seconds
    And the application should handle concurrent requests efficiently
    And no requests should timeout or fail

  Scenario: Memory Usage Efficiency
    When I navigate to the home page
    Then the JavaScript memory usage should be under 50 megabytes
    And memory should not continuously increase
    And there should be no memory leaks

  Scenario: Fast Page Navigation
    When I navigate from the home page to the learn page
    Then the navigation should complete within 1 second
    And the new page should load quickly
    And the transition should be smooth

  Scenario: Large Dataset Handling
    When I navigate to the learn page
    And a large vocabulary list is loaded
    Then 1000 items should render within 500 milliseconds
    And the page should remain responsive
    And scrolling should be smooth

  Scenario: Translation Performance
    When I enter text in the translator
    And I click the translate button
    Then the translation should appear within 2 seconds
    And the response should be fast
    And the interface should remain responsive

  Scenario: Search Performance
    When I type in the language search field
    Then search results should appear within 200 milliseconds
    And the search should be responsive
    And typing should not cause delays

  Scenario: Offline Performance
    Given I am offline
    When I try to use the application
    Then cached content should load quickly
    And offline functionality should work
    And error messages should appear promptly

  Scenario: Mobile Performance
    Given I am using a mobile device
    When I navigate through the application
    Then pages should load within performance budgets
    And touch interactions should be responsive
    And scrolling should be smooth

  Scenario Outline: Performance Under Different Network Conditions
    Given I have a "<network_type>" connection
    When I navigate to the home page
    Then the page should load within "<max_load_time>" seconds
    And the user experience should be acceptable

    Examples:
      | network_type | max_load_time |
      | 3G           | 5             |
      | 4G           | 3             |
      | WiFi         | 2             |

Note: Performance tests should be run in controlled environments with consistent network conditions to ensure reliable results.