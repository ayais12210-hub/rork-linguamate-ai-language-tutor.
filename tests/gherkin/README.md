# Gherkin Test Documentation

This directory contains Gherkin test specifications for the language learning application. These tests are written in a business-readable format that can be understood by both technical and non-technical stakeholders.

## Overview

Gherkin tests use the Given-When-Then format to describe application behavior in plain English. This approach makes tests accessible to business analysts, product managers, and legal teams while providing clear specifications for developers and QA engineers.

## Test Structure

Each `.feature` file contains:
- **Feature**: High-level description of the functionality being tested
- **Background**: Common setup steps for all scenarios in the feature
- **Scenarios**: Specific test cases with Given-When-Then steps
- **Examples**: Data-driven test cases using tables
- **Notes**: Important considerations for test execution

## Available Test Features

### Core Application Features
- **`translator.feature`** - Text translation functionality
- **`onboarding.feature`** - User onboarding and preference setup
- **`authentication.feature`** - User login, signup, and account management
- **`learning-modules.feature`** - Learning modules and exercises
- **`language-search.feature`** - Language search and selection

### Quality Assurance Features
- **`accessibility.feature`** - WCAG compliance and assistive technology support
- **`performance.feature`** - Core Web Vitals and application performance
- **`navigation.feature`** - Application navigation and routing
- **`smoke-tests.feature`** - Basic functionality verification

## Gherkin Syntax Guidelines

### Given-When-Then Structure
```gherkin
Scenario: Clear scenario title
  Given I am in a specific state
  When I perform an action
  Then I should see an expected result
```

### Best Practices
1. **Clear Feature Description**: Each feature explains what's being tested and why
2. **Descriptive Scenario Titles**: Scenario names clearly indicate what's being verified
3. **Complete Context**: Given steps provide all necessary preconditions
4. **Specific Actions**: When steps clearly describe user actions
5. **Verifiable Outcomes**: Then steps include clear, testable expectations
6. **Simple Language**: Avoid technical jargon like "API", "selector", or "endpoint"
7. **Data Examples**: Use Examples tables for data-driven scenarios

### Common Step Patterns

#### Navigation Steps
- `Given I am on the <page> page`
- `When I navigate to the <page> page`
- `Then I should be taken to the <page> page`

#### Interaction Steps
- `When I click the "<button_text>" button`
- `When I enter "<text>" in the <field> field`
- `When I select "<option>" from the <dropdown> dropdown`

#### Verification Steps
- `Then I should see "<text>"`
- `Then I should be redirected to the <page> page`
- `Then the <element> should be visible`

## Test Execution Notes

### Environment Considerations
- All tests should be performed in a test environment
- Use test user accounts to avoid affecting production data
- Ensure consistent network conditions for performance tests

### Accessibility Testing
- Use automated tools like axe-core for initial scans
- Perform manual testing with actual assistive technologies
- Test with keyboard-only navigation

### Performance Testing
- Run tests in controlled environments with consistent conditions
- Consider different network speeds and device types
- Monitor Core Web Vitals metrics

## Converting Technical Tests to Gherkin

When converting existing technical test scripts to Gherkin format:

1. **Identify the Feature**: Determine the overall functionality being tested
2. **Extract Scenarios**: Convert each test case into a separate scenario
3. **Translate Setup**: Convert setup code into "Given" steps
4. **Convert Actions**: Transform actions (clicks, inputs) into "When" steps
5. **Transform Assertions**: Change assertions into "Then" steps
6. **Replace Technical Terms**: Use user-friendly descriptions instead of technical selectors
7. **Add Examples**: Include data tables for parameterized tests

## Example Conversion

### Technical Test Script
```javascript
test('should update profile', async () => {
  await page.goto('/settings');
  await page.locator('[data-testid="edit-profile"]').click();
  await page.locator('#displayName').fill('John Smith');
  await page.locator('#save-button').click();
  await expect(page.locator('.success-message')).toContainText('Profile updated');
});
```

### Gherkin Format
```gherkin
Scenario: Update Display Name Successfully
  Given I am on the account settings page
  When I click on the "Edit Profile" button
  And I enter "John Smith" in the display name field
  And I click the "Save Changes" button
  Then I should see a success message "Profile updated successfully"
```

## Maintenance and Updates

- Update Gherkin tests when application features change
- Review and validate test scenarios with business stakeholders
- Ensure test coverage aligns with user stories and acceptance criteria
- Keep language simple and business-focused
- Regular review of test effectiveness and clarity

## Tools and Integration

These Gherkin tests can be integrated with:
- **Cucumber**: For automated test execution
- **BDD Frameworks**: For behavior-driven development
- **Test Management Tools**: For test case organization
- **Documentation Systems**: For living documentation

## Contact and Support

For questions about Gherkin test documentation or updates to test scenarios, please contact the QA team or refer to the project's testing guidelines.