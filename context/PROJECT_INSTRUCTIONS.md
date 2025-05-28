
# AI Project Context Management Instructions

This document provides internal instructions for the AI on how to manage project context effectively across user sessions for the "Riddle of the Beast App Companion" project.

## 🔁 When to Update Context Files

Context files (`PROJECT_CONTEXT_HISTORY.md` and `PROJECT_PROGRESS.md`) should be updated:

- After completing a major task or feature implementation.
- After the user decides something new about the project's direction, features, or scope.
- After any major discussion that clarifies requirements or introduces significant changes.
- When new data structures are defined or existing ones are significantly altered.
- After resolving significant bugs or technical challenges that impact the project's state.

## 📄 How to Update Context Files

- **`PROJECT_CONTEXT_HISTORY.md`**:
    - Append new relevant information to the appropriate sections (e.g., add new features to "Features Implemented", update "Technical Stack" if new libraries are added).
    - Ensure the summary remains structured and comprehensive.
    - Strive for clarity and conciseness.
    - Log significant changes made by the AI to the codebase within this file, perhaps under "Other Important Observations" or by updating feature descriptions.

- **`PROJECT_PROGRESS.md`**:
    - Move items from "WORKING" to "DONE" upon completion.
    - Add new tasks to "NEXT" or "WORKING" as they are identified or started.
    - Keep the status accurate and reflective of the current development phase.

- **General:**
    - Keep both files tidy and well-formatted.
    - Actively avoid duplicated information between the files or outdated information within them.
    - If a piece of information in `PROJECT_CONTEXT_HISTORY.md` becomes outdated due to a new decision, update it rather than just appending.

## 📌 Startup Routine

Before responding or taking action in any new session, **ALWAYS** perform the following startup routine:

1.  **Load and Parse Context History**:
    *   Read the entire content of `context/PROJECT_CONTEXT_HISTORY.md`.
    *   Internally parse and understand its structure and information to rebuild a comprehensive understanding of the project's current state, features, architecture, and history.

2.  **Load and Review Project Progress**:
    *   Read the entire content of `context/PROJECT_PROGRESS.md`.
    *   Note the tasks that are DONE, WORKING, and NEXT.

3.  **Utilize Context**:
    *   Use the information gathered from these files to inform all responses, code suggestions, planning, and decision-making.
    *   Refer to this context to avoid asking redundant questions or re-suggesting things already decided or implemented.

4.  **Verify Context Integrity**:
    *   If `PROJECT_CONTEXT_HISTORY.md` or `PROJECT_PROGRESS.md` are missing, seem significantly outdated, or contradict recent explicit user instructions, politely ask the user to clarify or provide updates before proceeding with complex tasks.

## ⚠️ Important Commands (to be followed by the AI)

-   `ALWAYS read context/*.md files before starting any session.`
-   `NEVER assume project status or historical decisions without checking PROJECT_CONTEXT_HISTORY.md and PROJECT_PROGRESS.md.`
-   `Update context files whenever a significant change happens or a major task is completed.`
-   `Log changes made by you (the AI) that affect the project's state or features in PROJECT_CONTEXT_HISTORY.md.`
-   `If the user provides a new context (e.g., an updated blueprint or progress list), integrate and persist this new information into the existing context files immediately and accurately.`
-   `Prioritize information from these context files over generalized knowledge when it pertains to this specific project.`
-   `When asked to make changes, refer to the existing codebase structure (as understood from the context files and previous interactions) to ensure consistency.`
-   `If a user request conflicts with established project decisions documented in the context, politely point out the conflict and ask for clarification.`
