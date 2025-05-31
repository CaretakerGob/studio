
# Project Context History: Riddle of the Beast App Companion

## 1. Project Objectives and Vision
- **Primary Goal:** Develop a comprehensive digital companion application for the "Riddle of the Beast" (RotB) board game.
- **Vision:** Enhance the gameplay experience by providing players with essential tools, character management, random event generation, and AI-powered features, all wrapped in a dark, horror-themed interface.
- **User Experience:** Intuitive, mobile-responsive, and thematically consistent with the board game.

## 2. Technical Stack and Architecture
- **Framework:** Next.js (v15.3.2) using the App Router.
    - Server Components are used by default.
    - Client Components are explicitly marked with `"use client"`.
- **Language:** TypeScript.
- **UI Components:** ShadCN UI (including Accordion for How to Play).
- **Styling:** Tailwind CSS, with custom theming via `globals.css` using HSL CSS variables.
- **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`).
- **Backend-as-a-Service (BaaS):** Firebase
    - **Authentication:** Firebase Authentication (Email/Password).
    - **Database:** Firebase Firestore (for user-specific data like saved characters, preferences, default character ID, and saved Nexus states).
    - **Storage:** Firebase Storage (for user profile images).
- **Generative AI:** Genkit (Google AI - Gemini models)
    - Implemented for an AI Item Generator feature (`item-generator-flow.ts`).
    - Implemented for an AI Shop Item Image Generator feature (`generate-shop-item-image-flow.ts`) (currently not used in Shop UI).
    - Flows are defined in `src/ai/flows/`.
- **External Data Sources:**
    - **Google Sheets API:** Used to fetch game data for Events, NPC Generator, Arsenal Cards, and Shop Items via server-side logic in page components. Shop items can be sourced from multiple tabs within the same Google Sheet.
    - **Local Filesystem (`fs` module):** Used server-side to read rulebook Markdown files for the "How to Play" page. Reads `RoTB_Rulebook_Dropdown_Structure.md` for structure and `Riddle_of_the_Beast_Rulebook.md` for detailed content.
- **Image Placeholders:** `https://placehold.co` and `https://picsum.photos`. Firebase Storage for character/card images.
- **Deployment:** Firebase App Hosting (inferred from build logs and setup).
- **Code Quality:**
    - `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` are set in `next.config.ts`, indicating a potential area for future tightening of build checks.

## 3. Features Implemented

### 3.1. Homepage (`/`)
- (No changes in this update)

### 3.2. Character Sheet (`/character-sheet`)
- (No changes in this update)

### 3.3. Dice Roller (`/dice-roller`)
- (No changes in this update)

### 3.4. Card Generator (`/card-generator`)
- (No changes in this update)

### 3.5. Events (`/item-list` - URL path)
- (No changes in this update)

### 3.6. NPC Generator (`/investigations`)
- (No changes in this update)

### 3.7. Item List (`/events` - URL path)
- (No changes in this update)

### 3.8. Whispers & Wares (Shop) (`/shop`)
- (No changes in this update)

### 3.9. AI Item Generator (`/item-generator`)
- (No changes in this update)

### 3.10. Shared Space (`/shared-space`)
- (No changes in this update)

### 3.11. User Profile (`/profile`)
- (No changes in this update)

### 3.12. FAQ (`/faq`)
- (No changes in this update)

### 3.13. Hunter's Nexus (`/hunters-nexus`)
- (No changes in this update)

### 3.14. How to Play (`/how-to-play`)
- Now uses `RoTB_Rulebook_Dropdown_Structure.md` for accordion structure (H2s as triggers).
- For each H2 and H3 from the structure file, it attempts to look up the heading in `Riddle_of_the_Beast_Rulebook.md` and pulls in the detailed content (paragraphs, lists, images) under that heading.
- List items from the structure file are rendered directly.
- Shop sections and specified tables continue to be omitted.
- Debug messages added if content lookup fails.

### 3.15. Terms of Service (`/terms`) & Privacy Policy (`/privacy`)
- (No changes in this update)

### 3.16. Layout & General
- (No changes in this update)

## 4. Features Currently Under Development
- (No changes in this update)

## 5. Planned Features / Future Work
- (No changes in this update)

## 6. Design Decisions and Constraints
- (No changes in this update)

## 7. Open Questions / Assumptions
- The "How to Play" page's content rendering heavily relies on consistent heading normalization and the presence of matching Markdown headings in `Riddle_of_the_Beast_Rulebook.md`.

## 8. Data Structures of the App
- (No changes in this update)

## 9. Firebase Rules, Cloud Functions, and APIs
- (No changes in this update)

## 10. Other Important Observations
- The "How to Play" page's complexity has increased due to the two-file content merging strategy.
- The parsing of Markdown for the "How to Play" page, especially for lists and multi-paragraph content from the main rulebook, is a delicate process.

This document provides a snapshot of the project's state and context.
    

    

