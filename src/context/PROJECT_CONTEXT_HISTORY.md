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
    - **Local Filesystem (`fs` module):** Used server-side to read `docs/Riddle_of_the_Beast_Rulebook.md` for the "How to Play" page.
- **Image Placeholders:** `https://placehold.co` and `https://picsum.photos`. Firebase Storage for character/card images.
- **Deployment:** Firebase App Hosting (inferred from build logs and setup).
- **Code Quality:**
    - `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` are set in `next.config.ts`, indicating a potential area for future tightening of build checks.

## 3. Features Implemented

### 3.1. Homepage (`/`)
- **Description:** Landing page with an overview of the app and quick links to all major features. Navigation cards consolidated (e.g., "Game Tools" card).
- **Visuals:** Thematic background image (customizable via URL in code), clear navigation cards for each feature.
- **Footer:** Links to Home, FAQ, Terms of Service (placeholder), Privacy Policy (placeholder).
- **Mobile Layout:** Feature cards stack vertically within a scrollable window.

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
- **Description:** Displays the game rules from `docs/Riddle_of_the_Beast_Rulebook.md`.
- **Functionality:**
    - Content is now presented in an **Accordion** format. Main sections (H1s and H2s from the rulebook) act as accordion triggers.
    - The content within each accordion item includes subheadings (H3-H6), paragraphs, basic lists, and images.
    - Specific shop item list sections (e.g., "Defense Gear Shop", "Melee Weapon Shop", "Loot Table", "Mystery Table", etc.) are **omitted** from the rendered output.
    - Basic inline Markdown (bold, italic) is parsed. Images from Markdown are rendered using `next/image`.
- **Data Source:** `docs/Riddle_of_the_Beast_Rulebook.md`.

### 3.15. Terms of Service (`/terms`) & Privacy Policy (`/privacy`)
- (No changes in this update)

### 3.16. Layout & General
- (No changes in this update beyond sidebar link for "How to Play")

## 4. Features Currently Under Development
-   Full implementation of the "Gear and Equipment" system (equipping individual items to character slots, managing a character-specific inventory).
-   Real-time collaboration features for the "Shared Space".
-   Functional friends list with real-time presence.
-   Complete item database for the "Item List" page (currently empty, data could come from shop sheet or a dedicated one).

## 5. Planned Features / Future Work
-   **Combat System UI:** A dedicated interface for managing combat encounters, tracking turns, enemy actions (potentially driven by Combat Cards), applying status effects, resolving attacks, etc.
-   **Integration of Rulebook Mechanics:**
    *   Implementing specific Skill Proficiencies.
    *   Status Effect application and tracking on characters/enemies.
    *   Detailed elemental attack resolution.
    *   Light/Darkness mechanics effects.
    *   Loot Table and Mystery Table integration into gameplay loops (Note: these tables are currently omitted from "How to Play" display).
    *   Character-specific unique abilities from the rulebook (Joe's Forage/Bounties, Nysa's Card Casting/Arcanas, etc.).
-   **Data Persistence:** (No change)
-   **Advanced AI Features (Genkit):** (No change)
-   **Bestiary/Monster Manual:** (No change)
-   **Digital Rulebook/References:** In-app access to game rules (current "How to Play" serves this purpose).
-   **Hunter's Nexus Enhancements**: (No change)
-   **Further Mobile Optimization**: (No change)
-   **Markdown Rendering**: Improved Markdown display on "How to Play" page using Accordion. Advanced features like complex tables or deeply nested lists within accordion content might need further refinement.
-   **Caching strategies for Google Sheet data**: (No change)

## 6. Design Decisions and Constraints
- (No changes in this update beyond Markdown parsing strategy)

## 7. Open Questions / Assumptions
- (No changes in this update)

## 8. Data Structures of the App
- (No changes in this update)

## 9. Firebase Rules, Cloud Functions, and APIs
- (No changes in this update)

## 10. Other Important Observations
- The "How to Play" page now uses `docs/Riddle_of_the_Beast_Rulebook.md` and presents it in an accordion style, omitting specified shop and table sections.

This document provides a snapshot of the project's state and context.
    
