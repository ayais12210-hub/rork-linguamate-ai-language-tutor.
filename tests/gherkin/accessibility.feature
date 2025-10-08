Feature: Accessibility Compliance
  As a user with disabilities
  I want the application to be accessible and usable with assistive technologies
  So that I can effectively use the language learning application

  Background:
    Given I am using assistive technology such as screen readers or keyboard navigation
    And I have navigated to the application

  Scenario: Onboarding Page Accessibility Compliance
    Given I am on the onboarding page
    When I perform an accessibility scan
    Then there should be no WCAG 2.0 AA violations
    And there should be no WCAG 2.1 AA violations
    And all accessibility standards should be met

  Scenario: Proper Heading Hierarchy
    Given I am on the onboarding page
    When I scan for heading elements
    Then I should find properly structured headings
    And the headings should follow a logical hierarchy
    And there should be at least one heading present

  Scenario: Accessible Form Controls
    Given I am on the onboarding page
    When I scan the form elements
    Then all form controls should have proper labels
    And there should be no unlabeled form fields
    And each form field should have only one label

  Scenario: Screen Reader Navigation Support
    Given I am on the onboarding page
    When I scan for navigation landmarks
    Then I should find main content areas
    And I should find navigation landmarks
    And I should find header landmarks
    And the landmarks should be properly identified

  Scenario: Translator Page Accessibility Compliance
    Given I am on the translator page
    When I perform an accessibility scan
    Then there should be no WCAG 2.0 AA violations
    And there should be no WCAG 2.1 AA violations
    And all accessibility standards should be met

  Scenario: Proper Focus Management
    Given I am on the translator page
    When I press the Tab key
    Then focus should move to the next interactive element
    And the focused element should be clearly visible
    And focus should be manageable through keyboard navigation

  Scenario: Accessible Form Labels
    Given I am on the translator page
    When I look for the text input field
    Then I should find a text input with proper labeling
    And the label should be associated with the input field
    And the label should describe the purpose of the input

  Scenario: Accessible Buttons with ARIA Labels
    Given I am on the translator page
    When I look for interactive buttons
    Then I should find a translate button with proper labeling
    And I should find copy buttons with proper labeling
    And all buttons should have descriptive names
    And the button purposes should be clear

  Scenario: Keyboard Navigation Support
    Given I am on the translator page
    When I navigate using only the keyboard
    And I press Tab to move between elements
    And I press Enter to activate elements
    Then I should be able to access all interactive elements
    And the navigation should be logical and intuitive

  Scenario: Sufficient Color Contrast
    Given I am on the translator page
    When I check the color contrast of text and backgrounds
    Then the contrast ratio should meet WCAG 2.0 AA standards
    And text should be readable against background colors
    And there should be no contrast violations

  Scenario: Dynamic Content Announcements
    Given I am on the translator page
    When I perform actions that change the content
    Then I should find live regions for dynamic content
    And screen readers should be notified of content changes
    And important updates should be announced

  Scenario: Alternative Text for Images
    Given I am on any page with images
    When I scan for image elements
    Then all images should have alternative text
    And decorative images should be marked as such
    And informative images should have descriptive alt text

  Scenario: Skip Links for Navigation
    Given I am on a page with multiple sections
    When I look for skip navigation options
    Then I should find skip links to main content
    And the skip links should be accessible via keyboard
    And they should help users bypass repetitive navigation

  Scenario: Error Message Accessibility
    Given I am on a form page
    When I submit the form with invalid data
    Then error messages should be clearly associated with form fields
    And error messages should be announced to screen readers
    And the errors should be easy to understand and fix

Note: All accessibility tests should be performed using automated tools like axe-core and manual testing with actual assistive technologies.