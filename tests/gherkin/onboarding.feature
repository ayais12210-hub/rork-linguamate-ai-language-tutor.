Feature: User Onboarding
  As a new user of the language learning application
  I want to set up my language preferences and difficulty level
  So that I can have a personalized learning experience

  Background:
    Given I am on the onboarding page
    And the page has loaded completely

  Scenario: Complete Onboarding Flow
    When I click the "Select Language" button
    And I select "Punjabi" from the language options
    And I click the "Beginner" difficulty button
    And I click the "Next" or "Continue" button
    Then I should be redirected to the learning dashboard
    And the URL should contain "learn", "home", or "dashboard"

  Scenario: Save Language Preferences
    When I click the "Select Language" button
    And I select "Punjabi" from the language options
    And I click the "Save" or "Continue" button
    And I reload the page
    Then I should see "Punjabi" displayed on the page
    And my language preference should be saved

  Scenario: Validate Required Fields
    When I click the "Next" or "Continue" button
    Without selecting any language or difficulty
    Then I should see a validation message
    And the message should indicate that selection is required

  Scenario: Skip Optional Steps
    Given there is a "Skip" button available
    When I click the "Skip" button
    Then I should be redirected to the learning dashboard
    And the URL should contain "learn", "home", or "dashboard"

  Scenario Outline: Select Different Languages
    When I click the "Select Language" button
    And I select "<language>" from the language options
    And I click the "Save" button
    Then I should see "<language>" displayed on the page

    Examples:
      | language |
      | Punjabi  |
      | Spanish  |
      | French   |
      | German   |
      | Italian  |

  Scenario Outline: Select Different Difficulty Levels
    When I select a language
    And I click the "<difficulty>" difficulty button
    And I click the "Next" button
    Then I should be redirected to the learning dashboard
    And my difficulty preference should be saved

    Examples:
      | difficulty |
      | Beginner    |
      | Intermediate|
      | Advanced    |

  Scenario: Navigate Back During Onboarding
    Given I have selected a language
    When I click the "Back" button
    Then I should return to the previous onboarding step
    And my previous selections should be preserved

  Scenario: Handle Onboarding Interruption
    Given I am in the middle of onboarding
    When I close the application
    And I reopen the application
    Then I should return to the onboarding flow
    And my previous selections should be preserved

Note: Onboarding preferences should be saved locally to persist across app sessions.