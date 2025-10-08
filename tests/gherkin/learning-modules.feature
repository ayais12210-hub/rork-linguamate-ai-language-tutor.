Feature: Learning Modules
  As a user of the language learning application
  I want to access and complete different learning modules
  So that I can improve my language skills through various exercises

  Background:
    Given I am on the learn page
    And the page has loaded completely

  Scenario: Navigate Through Alphabet Module
    When I click on the "Alphabet" module button
    Then I should see the alphabet learning content
    And the alphabet module should be displayed
    And I should be able to navigate back to the main learn page

  Scenario: Complete Phonics Trainer
    When I click on the "Phonics" module button
    And I wait for the phonics trainer to load
    Then I should see phonics exercise elements
    And the phonics trainer should be functional
    And I should be able to interact with the exercises

  Scenario: View Vocabulary Flashcards
    When I click on the "Vocabulary" module button
    And I wait for the vocabulary section to load
    Then I should see vocabulary flashcards
    And the flashcards should be interactive
    And I should be able to flip through them

  Scenario: Use Pronunciation Playback
    When I find a pronunciation button
    And I click the pronunciation or audio button
    Then the audio should start playing
    And the pronunciation should be clear

  Scenario: Access AI Learning Tips
    When I click on the "AI Tips" button
    Then I should see helpful learning tips
    And the tips should contain useful insights or advice
    And the tips should be relevant to my learning

  Scenario: Complete Quick Quiz
    When I click on the "Quiz" or "Test" button
    Then I should see quiz questions
    And I should be able to answer the questions
    And the quiz should be interactive

  Scenario: Track Learning Progress
    When I view the learn page
    Then I should see progress indicators
    And my progress should be tracked
    And I should be able to see my completion status

  Scenario: Handle Offline Learning Mode
    Given I am offline
    When I try to access a learning module
    Then I should see an offline indicator
    Or I should see cached content
    And the application should handle offline mode gracefully

  Scenario: Navigate Back from Module
    Given I am in a learning module
    When I click the "Back" or "Return" button
    Then I should return to the main learn page
    And my progress should be preserved

  Scenario: Module Completion Feedback
    When I complete a learning module
    Then I should receive completion feedback
    And my progress should be updated
    And I should be encouraged to continue learning

  Scenario: Module Difficulty Progression
    Given I have completed beginner modules
    When I view available modules
    Then I should see intermediate modules unlocked
    And the difficulty should progress appropriately

  Scenario Outline: Access Different Learning Modules
    When I click on the "<module_name>" module button
    Then I should see the "<module_name>" learning content
    And the module should be functional

    Examples:
      | module_name |
      | Alphabet    |
      | Phonics     |
      | Vocabulary  |
      | Grammar     |
      | Conversation|

Note: Learning modules should provide immediate feedback and track progress to maintain user engagement.