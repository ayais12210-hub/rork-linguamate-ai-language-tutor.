Feature: Text Translation
  As a user of the language learning application
  I want to translate text between different languages
  So that I can understand and learn new languages

  Background:
    Given I am on the translator page
    And the page has loaded completely

  Scenario: Complete Translation Workflow
    When I enter "Hello" in the text input field
    And I click the "Translate" button
    Then I should see the translation result appear
    And the translation should be visible within 10 seconds

  Scenario: Copy Translated Text to Clipboard
    Given I have cleared my clipboard
    When I enter "Hello" in the text input field
    And I click the "Translate" button
    And I wait for 2 seconds
    And I click the first "Copy" button
    Then I should see a "Copied" message appear
    And the message should be visible within 3 seconds

  Scenario: Paste Text from Clipboard
    Given I have "Test text" in my clipboard
    When I click the "Paste" button
    Then the text input field should contain "Test text"

  Scenario: Clear Input Text
    When I enter "Test text to clear" in the text input field
    And I click the "Clear" button
    Then the text input field should be empty

  Scenario: Play Audio Pronunciation
    When I enter "Hello" in the text input field
    And I click the "Translate" button
    And I wait for 2 seconds
    And I click the first audio playback button
    Then the audio should start playing

  Scenario: View AI Coach Insights
    When I enter "Hello" in the text input field
    And I click the "Translate" button
    And I wait for 2 seconds
    Then I should see AI coach insights about pronunciation, meaning, structure, or usage
    And the insights should be visible within 5 seconds

  Scenario: Use Speech-to-Text Input
    Given I have granted microphone permissions
    When I click the speech-to-text button
    And I wait for 1 second
    And I click the speech-to-text button again
    Then the text input field should contain spoken text

  Scenario: Switch Between Languages
    When I click the first language selector
    And I select "Punjabi" from the language options
    Then the language selector should display "Punjabi"

  Scenario: View Text Suggestions
    When I enter "H" in the text input field
    Then I should see text suggestions appear
    And the suggestions should be visible within 3 seconds

  Scenario: Handle Network Errors Gracefully
    Given the translation service is unavailable
    When I enter "Hello" in the text input field
    And I click the "Translate" button
    Then I should see an error message about network issues
    And the error message should be visible within 5 seconds

  Scenario Outline: Translate Different Text Types
    When I enter "<text>" in the text input field
    And I click the "Translate" button
    Then I should see a translation result
    And the result should appear within 10 seconds

    Examples:
      | text                    |
      | Hello                   |
      | Good morning            |
      | How are you?            |
      | Thank you               |
      | Excuse me               |

Note: All translation tests should be performed in a test environment to avoid affecting production translation services.