
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
    - **Local Filesystem (`fs` module):** Used server-side to read `Riddle_of_the_Beast_Rulebook.md` for the "How to Play" page content and `Horror Journal Rulebook.md` for the "Mission Tracker" enemy data.
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
- (No changes in this update)

### 3.15. Mission Tracker (`/mission-tracker`) - NEW
- **Initial Setup:** New page and route created.
- **Enemy Data Parsing:**
    - Created `src/lib/enemy-parser.ts` with `parseHorrorJournal` function.
    - This function reads `Horror Journal Rulebook.md` and parses enemy data based on `#` (enemy name), `##` (sections like Base Stats, Base Attacks, Logic), and `###` (sub-sections like Armor).
    - Extracts: Name, CP, Template, HP, MV, Def, San, Armor (Name & Effect), basic Melee/Range attack details, and Logic string.
    - Basic ability titles are captured, but detailed multi-line ability descriptions are not yet fully parsed.
- **Data Types:** Defined in `src/types/mission.ts` for `Enemy`, `EnemyStatBlock`, `EnemyAttack`, `EnemyArmor`, `EnemyLogic`, `ActiveEnemy`.
- **Basic UI (`mission-tracker-ui.tsx`):**
    - Displays a dropdown to select from parsed enemies.
    - Allows adding selected enemies to an "Active Encounter" list.
    - Each active enemy in the encounter shows: Name, CP, Template, current HP (with +/- buttons for tracking), MV, DEF, SAN, Armor, basic Melee/Range, and Logic.
    - Button to remove an enemy from the encounter.
- **Sidebar Integration:** Added "Mission Tracker" link under "Game Tools".

### 3.16. Terms of Service (`/terms`) & Privacy Policy (`/privacy`)
- (No changes in this update)

### 3.17. Layout & General
- (No changes in this update)

## 4. Features Currently Under Development
- **Mission Tracker Enhancements:**
    - Parsing and displaying detailed enemy abilities (Special 1, Special 2, Signature, Passives) from the rulebook.
    - Handling enemy variations described in tables (e.g., Animated Objects, Drowned Ones).
    - UI for managing specific Hunts/Investigations, objectives, and POIs.
    - Integration with card decks (Combat Cards, Clash Cards).
    - Tracking for more enemy stats (e.g., Sanity for active enemies, status effects).

## 5. Planned Features / Future Work
- (No changes directly related to this update's feature, but existing items remain)

## 6. Design Decisions and Constraints
- **Enemy Parsing:** Initial parser focuses on core stats and simple fields. Complex multi-line descriptions (like detailed abilities) and table-based variations are deferred for future enhancement due to parsing complexity.
- **Mission Tracker UI:** Initial UI is focused on basic enemy selection and HP tracking.

## 7. Open Questions / Assumptions
- The `Horror Journal Rulebook.md` format is assumed to be relatively consistent for the initial parser. Significant deviations might require parser adjustments.

## 8. Data Structures of the App
- New types added in `src/types/mission.ts`: `EnemyArmor`, `EnemyStatBlock`, `EnemyAttack`, `EnemyLogic`, `EnemyAbility`, `Enemy`, `ActiveEnemy`.

## 9. Firebase Rules, Cloud Functions, and APIs
- (No changes in this update)

## 10. Other Important Observations
- The `Horror Journal Rulebook.md` is a critical data source for the new Mission Tracker.

This document provides a snapshot of the project's state and context.
    

    




