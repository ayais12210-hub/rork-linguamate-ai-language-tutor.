Feature: Language Search
  As a user of the language learning application
  I want to search for languages by name
  So that I can quickly find and select the language I want to learn

  Background:
    Given I am on a page with a language search bar
    And the search bar is visible and functional

  Scenario: Display Search Bar with Placeholder
    When I view the language search component
    Then I should see a search input field
    And the placeholder text should say "Search languages"

  Scenario: Display Current Search Value
    Given the search bar has a current value of "punjabi"
    When I view the language search component
    Then I should see "punjabi" displayed in the search field

  Scenario: Search with Debounced Input
    When I type "pa" in the search field
    And I wait for 200 milliseconds
    Then the search should be triggered
    And the search results should update

  Scenario: Show Clear Button When Text is Present
    Given I have entered "test" in the search field
    When I view the search component
    Then I should see a clear button
    And the clear button should be visible

  Scenario: Hide Clear Button When Text is Empty
    Given the search field is empty
    When I view the search component
    Then I should not see a clear button
    And the clear button should be hidden

  Scenario: Clear Search Input
    Given I have entered "test" in the search field
    When I click the clear button
    And I wait for 200 milliseconds
    Then the search field should be empty
    And the search should be reset

  Scenario: Search Accessibility
    When I view the language search component
    Then the search field should have proper accessibility labels
    And screen readers should be able to identify it as "Search languages"

  Scenario: Search Results Display
    When I type "span" in the search field
    And I wait for the search to complete
    Then I should see language options containing "span"
    And the results should be relevant to my search

  Scenario: No Results Found
    When I type "xyz123" in the search field
    And I wait for the search to complete
    Then I should see a "No results found" message
    And the message should be clear and helpful

  Scenario: Case Insensitive Search
    When I type "SPANISH" in the search field
    And I wait for the search to complete
    Then I should see "Spanish" in the results
    And the search should work regardless of case

  Scenario: Partial Match Search
    When I type "ger" in the search field
    And I wait for the search to complete
    Then I should see "German" in the results
    And partial matches should be included

  Scenario: Cancel Previous Search
    Given I have started typing "spanish"
    When I quickly change the input to "french"
    And I wait for the search to complete
    Then I should see results for "french"
    And the previous "spanish" search should be cancelled

  Scenario Outline: Search Different Language Terms
    When I type "<search_term>" in the search field
    And I wait for the search to complete
    Then I should see "<expected_result>" in the results

    Examples:
      | search_term | expected_result |
      | spanish     | Spanish         |
      | french      | French          |
      | german      | German          |
      | italian     | Italian         |
      | punjabi     | Punjabi         |

Note: The search functionality should be responsive and provide immediate feedback to users.