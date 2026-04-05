# Personal Relationship PRM User Stories

This document captures MVP user stories in Gherkin syntax for a personal relationship PRM focused on friends first and networking second.

## Phase 1: Core PRM Foundation

Feature: Authentication and private access
  As a user
  I want secure access to my PRM
  So that my personal relationship data stays private

  Scenario: Sign in to a private workspace
    Given I am a registered user
    When I sign in successfully
    Then I should be taken to my PRM workspace
    And I should only be able to access my own relationship data

Feature: Person profiles
  As a user
  I want to create and maintain person profiles
  So that I can remember who people are and how I know them

  Scenario: Create a new person profile
    Given I am signed in
    When I create a person with their name, category, and relationship context
    Then the person profile should be saved
    And the profile should appear in my people list

  Scenario: Track relationship category and status
    Given a person profile exists
    When I assign a category and status to that person
    Then the profile should show whether they are a friend, networking contact, mentor, family member, or acquaintance
    And the profile should show whether the relationship is active, dormant, or archived

  Scenario: Add contact methods to a person
    Given a person profile exists
    When I add one or more contact methods for that person
    Then each contact method should be saved on the profile
    And I should be able to mark one contact method as primary

Feature: Interaction capture
  As a user
  I want to log interactions quickly
  So that I can keep an accurate history of my relationships

  Scenario: Log a manual interaction note
    Given a person profile exists
    When I create an interaction with a date, type, and freeform note
    Then the interaction should be saved to that person's timeline
    And the person's last interaction date should be updated

  Scenario: View a person's interaction timeline
    Given a person has one or more interactions
    When I open the person detail page
    Then I should see their profile information
    And I should see their interaction history in chronological order

  Scenario: Record a multi-person interaction
    Given multiple person profiles exist
    When I log one interaction and link all attendees to it
    Then the interaction should be stored once
    And each linked person should show that interaction in their history

Feature: Timeline visibility
  As a user
  I want a shared timeline view
  So that I can review recent touchpoints across all people

  Scenario: Review recent interactions across the PRM
    Given interactions exist for multiple people
    When I open the timeline page
    Then I should see recent interactions across my PRM
    And each interaction should link back to the related person or people

## Phase 2: AI Memory Layer

Feature: Fact extraction from notes
  As a user
  I want the system to extract candidate facts from my notes
  So that important details become easier to remember and organize

  Scenario: Extract facts from a saved interaction
    Given an interaction contains a meaningful freeform note
    When fact extraction runs on that interaction
    Then the system should create candidate facts for the related person
    And each fact should include a link back to the source interaction

  Scenario: Review and edit extracted facts
    Given candidate facts were extracted from an interaction
    When I review an extracted fact
    Then I should be able to edit it, accept it, or delete it

Feature: Relationship summaries
  As a user
  I want AI-generated relationship summaries
  So that I can quickly recall the most important context about someone

  Scenario: Generate a relationship snapshot
    Given a person has profile data and interaction history
    When summary generation runs
    Then the system should create a profile brief for that person
    And the brief should reflect both stable context and recent themes

  Scenario: Generate a next-meeting brief
    Given a person has facts and recent interactions
    When I request a next-meeting brief
    Then the system should generate a short summary of what to remember before seeing them
    And the summary should be grounded in recent source material

  Scenario: Refresh summaries after new activity
    Given a person already has a saved summary
    When a new interaction is added for that person
    Then the system should refresh the relevant summaries
    And the updated summaries should include the newer context

Feature: Follow-ups and reminders
  As a user
  I want helpful reminder suggestions
  So that I do not forget open loops or important follow-ups

  Scenario: Suggest a follow-up task from an interaction
    Given an interaction note contains a likely follow-up opportunity
    When task extraction runs
    Then the system should suggest a follow-up task
    And the task should reference the interaction that caused it

  Scenario: Review AI-created reminder suggestions
    Given the system generated one or more reminder suggestions
    When I review the suggested reminders
    Then I should be able to keep, edit, snooze, or dismiss them

## Phase 3: Semantic Recall and Ask Interface

Feature: Semantic search over relationship history
  As a user
  I want semantic search across notes and documents
  So that I can find relevant memories even when I do not remember exact wording

  Scenario: Embed source documents for retrieval
    Given source documents or interaction notes exist
    When the embedding pipeline runs
    Then the content should be chunked and embedded
    And the embeddings should be available for semantic search

  Scenario: Search for a theme in natural language
    Given notes and source documents have been embedded
    When I search for "who mentioned job searching recently"
    Then the system should return relevant people, notes, or facts
    And the results should be ranked by relevance

Feature: Ask my PRM
  As a user
  I want to ask natural-language questions about my relationships
  So that I can retrieve context the way I naturally think

  Scenario: Ask what to remember before seeing someone
    Given a person has profile data, facts, and interactions
    When I ask what I should remember before seeing that person
    Then the system should generate a concise answer
    And the answer should cite the notes or facts it used

  Scenario: Ask for cross-person recall
    Given multiple people have relevant notes or facts in the PRM
    When I ask which people mentioned moving recently
    Then the system should return the matching people
    And the answer should include supporting source snippets

  Scenario: Combine structured filtering with semantic retrieval
    Given people, facts, and embeddings exist in the PRM
    When I ask for networking contacts in Seattle who mentioned a job change
    Then the system should use structured filters and semantic retrieval together
    And the answer should only include relevant matching contacts

## Phase 4: Plans, rate limits, and fair use

Feature: Usage limits and predictable costs
  As a user of a hosted PRM
  I want clear limits and steady performance
  So that the service stays reliable and I understand what I am entitled to use

  Scenario: Respect per-user rate limits on sensitive actions
    Given I am signed in
    When I perform actions that are expensive for the host (such as AI extraction, summary refresh, or semantic search)
    Then the system should enforce reasonable per-user rate limits
    And I should receive a clear message when I need to wait or try again later

  Scenario: Different limits by subscription tier
    Given the product offers a free tier and a paid tier
    When I compare what each tier includes
    Then limits for AI usage, imports, or high-volume features should be higher on the paid tier than on the free tier
    And the limits should be described in plain language before I subscribe or upgrade

  Scenario: Core PRM works when AI limits are reached
    Given I have reached my AI or premium-feature limit for the current period
    When I continue using the PRM
    Then I should still be able to use core PRM features such as people, interactions, and timeline
    And AI-backed features should fail gracefully with guidance on when I can use them again or how to upgrade

Feature: Paid tier and upgrades
  As a user who needs more capacity
  I want a straightforward paid option
  So that I can use the product heavily without surprise cutoffs

  Scenario: Upgrade to unlock higher limits
    Given I am on the free tier and I hit a documented limit
    When I choose to upgrade to the paid tier
    Then my subscription should unlock the higher limits associated with that tier
    And I should see confirmation of what changed

  Scenario: Optional bring-your-own API key
    Given the product supports connecting my own model provider account
    When I add my own API key according to the product’s instructions
    Then AI features may use my key for inference where supported
    And I should understand that usage on my provider bill is my responsibility

  Scenario: Usage visibility for the current period
    Given I am on a plan with periodic limits (such as monthly AI credits)
    When I view my account or plan settings
    Then I should see my current usage and remaining allowance for those limits
    And the numbers should match the limits described for my tier

Feature: Abuse resistance without punishing normal use
  As a user and as part of a shared hosted service
  I want proportionate protections
  So that bad actors cannot burn down the product for everyone

  Scenario: Protect signup and authentication endpoints
    Given the service is publicly reachable
    When automated or repeated abuse targets sign-in or sign-up
    Then the system should apply appropriate throttling or challenge mechanisms
    And legitimate users should still be able to access their accounts

## Phase 5: Imports and Relationship Modes

Feature: Calendar and email imports
  As a user
  I want optional imports from tools I already use
  So that I can reduce manual entry without losing control

  Scenario: Import a calendar event for review
    Given I connected my calendar
    When a new calendar event is imported
    Then the event should be saved as a source document or interaction candidate
    And it should appear in an inbox for review before being fully adopted into the PRM

  Scenario: Link an imported artifact to a person
    Given an imported event or email exists in the inbox
    When I confirm which person it belongs to
    Then the source document should be linked to that person
    And it should become available for summaries, tasks, and search

  Scenario: Keep email import optional
    Given I have not enabled email import
    When the PRM processes my data sources
    Then email data should not be imported automatically

Feature: Friend mode and networking mode
  As a user
  I want the PRM to adapt to different relationship types
  So that the product feels appropriate for both personal and professional contexts

  Scenario: Emphasize friend-oriented context
    Given a person is categorized as a friend
    When I view their profile and summaries
    Then the PRM should emphasize life updates, open loops, and meaningful personal context

  Scenario: Emphasize networking-oriented context
    Given a person is categorized as a networking contact
    When I view their profile and summaries
    Then the PRM should emphasize company, role, career context, and follow-up cadence

  Scenario: Avoid invasive automation
    Given imports and AI features are enabled
    When the system suggests new data or actions
    Then the system should not send messages automatically
    And the system should not scrape unrelated personal data by default

## Cross-Phase Requirements

Feature: Trust, transparency, and privacy
  As a user
  I want the PRM to be transparent and easy to control
  So that I can trust it with sensitive personal information

  Scenario: Show why a summary or reminder exists
    Given the system generated a summary, fact, or reminder
    When I inspect that output
    Then I should be able to see the source note, interaction, or document behind it

  Scenario: Remove sensitive remembered information
    Given a fact, note, or reminder exists in the PRM
    When I delete it
    Then it should no longer appear in summaries, reminders, or search results after processing completes

  Scenario: Keep the product warm rather than transactional
    Given I am using the PRM to manage personal relationships
    When the system presents summaries, tasks, or suggestions
    Then the tone and framing should support genuine connection rather than sales-style pipeline management
