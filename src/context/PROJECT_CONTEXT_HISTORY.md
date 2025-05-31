

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
- **UI Components:** ShadCN UI.
- **Styling:** Tailwind CSS, with custom theming via `globals.css` using HSL CSS variables.
- **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`).
- **Backend-as-a-Service (BaaS):** Firebase
    - **Authentication:** Firebase Authentication (Email/Password).
    - **Database:** Firebase Firestore (for user-specific data like saved characters, preferences, default character ID).
    - **Storage:** Firebase Storage (for user profile images).
- **Generative AI:** Genkit (Google AI - Gemini models)
    - Implemented for an AI Item Generator feature (`item-generator-flow.ts`).
    - Implemented for an AI Shop Item Image Generator feature (`generate-shop-item-image-flow.ts`).
    - Flows are defined in `src/ai/flows/`.
- **External Data Sources:**
    - **Google Sheets API:** Used to fetch game data for Events, NPC Generator, Arsenal Cards, and Shop Items via server-side logic in page components. Requires service account credentials. Shop items can be sourced from multiple tabs within the same Google Sheet.
- **Image Placeholders:** `https://placehold.co` and `https://picsum.photos`.
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
- **Description:** Digital management of player characters.
- **Functionality:**
    - Selection from predefined character templates (Gob, Cassandra, Fei, Michael, Tamara, Trish, Blake, Walter) or a customizable "Custom Character". Images for predefined characters updated.
    - Track core stats (HP, Sanity, MV, DEF) with interactive trackers and dynamic progress bar colors.
    - **Crypto Tracker:** Added a "Crypto" currency tracker. Defaults to 0. Can be manually adjusted. Saved with character data.
    - Manage skills:
        - Predefined characters have set skill values.
        - "Custom Character" uses a point-buy system (CP cost) for skills (ATH, CPU, DARE, DEC, EMP, ENG, INV, KNO, OCC, PERS, SUR, TAC, TUN). Min level 1 once a point is invested.
    - Manage abilities (Actions, Interrupts, Passives, FREE Actions):
        - Predefined characters have set abilities with cooldown/quantity trackers.
        - "Custom Character" can purchase abilities from a master list (cost 50 CP each).
    - Equip "Arsenal Cards" (fetched from Google Sheet):
        - Arsenals are collections of specific items (weapons, gear, abilities, pets).
        - Selected arsenal's front/back images are displayed on the "Arsenal" tab.
        - Weapons from an equipped arsenal (flagged as "Weapon: TRUE" or category "LOAD OUT"/"WEAPON") override the character's base weapons.
        - Companions (pets) from arsenals (flagged "Pet: TRUE") have their stats (HP, Sanity, MV, DEF, Melee Attack) displayed with interactive trackers on the "Stats & Equipment" tab. Their abilities are also shown.
        - Abilities granted by Arsenal items (flagged "Is Action: Y", etc.) are dynamically added to the character's abilities list.
    - Save and load character configurations for logged-in users via Firebase Firestore.
    - "Reset Template" button reverts the current sheet to the selected character's default template values (does not affect saved data).
- **Layout:** Tab-based (Stats & Equipment, Abilities, Arsenal, Skills). Refactored into multiple sub-components for better organization.
- **Mobile Optimization:** Responsive layouts for stats, tabs, and controls.

### 3.3. Dice Roller (`/dice-roller`)
- **Description:** Versatile dice rolling tool.
- **Functionality:**
    - **Numbered Dice:** Configure and roll multiple groups of numbered dice (d4, d6, d8, d10, d100, d12, d20, custom sides) simultaneously.
    - **Combat Dice:** Roll custom 6-sided dice with image-based faces (3x Sword & Shield, 1x Double Sword, 2x Blank). Input for number of combat dice to roll (max 12).
    - Display of latest roll results (individual dice, group totals/summaries, overall total for numbered dice).
    - Roll history for the last 20 rolls with clear buttons.
    - Reset buttons for numbered and combat dice sections.
- **Visuals:** Uses actual images for combat dice faces.
- **Layout:** Refactored into sub-components.

### 3.4. Card Generator (`/card-generator`)
- **Description:** Draw random cards from various in-game decks.
- **Functionality:**
    - Select a deck from a dropdown menu (Event, Item, Madness, Clash, Combat).
    - Draw a random card from the selected deck.
    - Display the latest drawn card prominently with its image and details.
    - History of the last 2 previously drawn cards.
    - "Held Cards" section: Cards marked as "holdable" are added to the player's hand and also displayed as the latest drawn. Player can "play" a held card, moving it to the main display and history.
- **Data Source:** Sample card data (including image URLs for Madness and Clash cards) is hardcoded.
- **Layout:** Refactored into sub-components. Mobile optimized.

### 3.5. Events (`/item-list` - URL path)
- **Description:** Random event generator (this page is linked as "Events" in the sidebar).
- **Functionality:**
    - Select event criteria from dropdowns: Random Type (Any Color, Random Chaos, Random Order), Specific Chaos Colors, Specific Order Colors.
    - Generate a single random event matching the criteria.
    - Display the selected event with a thematic background image based on its color.
    - History of the last 2 previously drawn events.
    - "Reset Events" button.
- **Data Source:** Event data (Color, Type, Description - Insert & Count columns are fetched but hidden) from a Google Sheet.
- **Layout:** Refactored into sub-components.

### 3.6. NPC Generator (`/investigations`)
- **Description:** Generate random NPC encounters.
- **Functionality:**
    - Select a "Location Color" from a dropdown.
    - Roll a 1d6 for the selected location.
    - Display the specific NPC details (NPC, Unit, Persona, Demand, Skill Check, Goals, Passive, Description).
    - "Reset" button.
- **Data Source:** NPC encounter data (formerly "Investigation data") from a Google Sheet.
- **Layout:** Refactored into sub-components.

### 3.7. Item List (`/events` - URL path)
- **Description:** A placeholder page (linked as "Item List" in the sidebar) intended for viewing a list of game items.
- **Functionality:** Currently displays an empty table structure.

### 3.8. Whispers & Wares (Shop) (`/shop`)
- **Description:** In-game shop for purchasing items.
- **Functionality:**
    - Displays items for purchase categorized into tabs (Defense, Melee Weapon, Ranged Weapon, Augment, Utility, Consumable, Relic).
    - Utility items are further sub-categorized within their tab.
    - Simulated "Crypto" currency tracker (client-side state).
    - Simulated purchasing logic (deducts Crypto, updates stock for consumables).
    - Item data (Name, Cost, Category, Effect, SubCategory, and other optional fields like Stock, Weapon Class, Attack, etc.) is fetched from a Google Sheet (can use multiple tabs).
    - AI image generation for items without sheet URLs removed from UI (flow still exists).
- **Data Source:** Google Sheets for item data.

### 3.9. AI Item Generator (`/item-generator`)
- **Description:** Uses Genkit to generate unique game items.
- **Functionality:**
    - User inputs: Item Type, optional Theme, optional Rarity, optional Stat Focus, optional Lore Context (user-provided text excerpt).
    - Shop items (fetched from Google Sheet) are used as examples for the AI.
    - Genkit flow (`item-generator-flow.ts`) processes inputs and prompts an LLM to generate item details (name, type, lore description, game effect, generated rarity) adhering to the "Riddle of the Beast" rules.
    - Displays the generated item in a card format.
- **Data Source for Examples:** Shop items from Google Sheets.

### 3.10. Shared Space (`/shared-space`)
- **Description:** Placeholder for a collaborative session feature.
- **Functionality:**
    - Enter an access code to "join" a session.
    - Access code is currently hardcoded (`BEAST_PARTY`) for demonstration.
    - Displays a placeholder message for shared content upon successful "join".

### 3.11. User Profile (`/profile`)
- **Description:** Manage user account and saved data.
- **Functionality:**
    - User authentication (Sign Up, Log In, Log Out) via Firebase Authentication (Email/Password).
    - View and edit display name.
    *   Upload and change profile picture (saved to Firebase Storage).
    *   "Change Password" option (sends a password reset email via Firebase).
    *   Manage Saved Characters:
        *   List saved characters with name, base template type, avatar, and last saved date.
        *   Load a saved character onto the Character Sheet (navigates with query param).
        *   Rename saved characters (persisted to Firestore). Blank name resets to "Custom [Template]" or "Custom Character".
        *   Duplicate saved characters (creates a new custom character copy in Firestore).
        *   Delete saved characters from Firestore (with confirmation dialog).
        *   Set a character as default (preference saved to Firestore: `userCharacters/{userId}/preferences/userPrefs`). Character Sheet attempts to load this default.
    *   Simulated friends list with online status indicators.
- **Layout:** Refactored into sub-components (`AuthForm`, `UserProfileDisplay`, `EditProfileForm`).

### 3.12. FAQ (`/faq`)
- **Description:** Frequently Asked Questions page.
- **Functionality:** Displays FAQs categorized into "App Questions" and "Board Game Concepts" using accordion style.

### 3.13. Hunter's Nexus (`/hunters-nexus`)
- **Description:** Session-based, multiplayer game management hub.
- **Functionality:**
    - Allows selection of a character template for the session.
    - Displays core stats (HP, Sanity, MV, DEF) with interactive trackers and session-based max stat modifiers.
    - **Session Crypto Tracker:** Added a "Session Crypto" tracker, initialized from the selected character's saved crypto (or 0 if new), and can be manually adjusted during the session. Displayed on main page and in character modal.
    - Displays selected arsenal card (front/back images) and its equipment.
    - Allows clicking on character avatar and arsenal card images to view them in a larger modal.
    - Provides a simple dice roller (numbered and combat dice).
    - Provides a card generator for drawing from game decks.
    - Shows a list of party members (currently just the selected character).
    - Displays character abilities (base and arsenal-granted) with cooldown/quantity trackers in a modal.
    - Displays character skills and weapons (base and arsenal-modified) in a modal.
    - Max Mod trackers for MV and DEF added to character modal.
- **Data Sources:** Character templates from `character-sheet-ui.tsx`, Arsenal Cards from Google Sheets (via props), card decks from `card-generator-ui.tsx`. State is client-side for the session.

### 3.14. Layout & General
- **Sidebar:** Persistent sidebar with navigation links, collapsible on desktop, sheet-style on mobile. "Game Tools" items grouped. "Future Features" dropdown created for AI Item Generator and NPC Generator, which are now greyed out/disabled.
- **Toasts:** Used for user feedback on various actions.
- **Theme:** Dark, horror-inspired theme defined in `globals.css`.

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
    *   Loot Table and Mystery Table integration into gameplay loops.
    *   Character-specific unique abilities from the rulebook (Joe's Forage/Bounties, Nysa's Card Casting/Arcanas, etc.).
-   **Data Persistence:**
    *   Saving current pet HP/Sanity.
    *   Saving character inventory.
    *   Persisting AI-generated shop item images (e.g., to Firebase Storage, updating Google Sheet with URL).
-   **Advanced AI Features (Genkit):**
    *   Dynamic NPC dialogue.
    *   AI-assisted event or NPC detail generation.
    *   Retrieval Augmented Generation (RAG) for using large lore documents (like the user's book) to inform AI generation.
-   **Bestiary/Monster Manual:** A section to view details about game enemies.
-   **Digital Rulebook/References:** In-app access to game rules.
-   **Performance Optimization:** Caching strategies for Google Sheet data (ISR, server-side caching).

## 6. Design Decisions and Constraints
-   **Tech Stack Choice:** Next.js, React, TypeScript, ShadCN, Tailwind, Firebase, Genkit, Google Sheets API.
-   **Data Flow for Sheets:** Server Components fetch data from Google Sheets on page load.
-   **Modularity:** Ongoing effort to refactor large components into smaller, focused ones.
-   **Styling:** Primary reliance on ShadCN component styling and Tailwind utilities, with global theme variables.
-   **AI Integration:** Genkit for LLM interactions, keeping AI logic in server-side flows. User-provided lore excerpts can be passed to AI. Shop item image generation is session-based.
-   **State Management:** Primarily local component state and React Context for authentication.
-   **User Data:** Stored in Firestore under user-specific paths for security and organization.
-   **Error Handling:** Implemented for API calls (Google Sheets, Firebase) and user actions.
-   **Prototyping:** Some features like Shared Space and Friends List are currently simulated on the client-side.

## 7. Open Questions / Assumptions
-   **Combat UI/UX:** How will the detailed turn-based combat be represented and managed interactively in the app?
-   **Game State Management:** For a full combat simulation or shared space, a more robust game state management solution might be needed beyond current page/component state.
-   **Scalability of Google Sheets:** For very large datasets, alternative database solutions might be considered for performance, though Google Sheets is suitable for moderate game data.
-   **Offline Support:** Currently, features relying on online data (Firebase, Google Sheets) require a connection.
-   **Detailed Game Logic Implementation:** The depth to which specific board game rules (e.g., enemy AI from combat cards, complex status interactions) will be automated in the app vs. just tracked.

## 8. Data Structures of the App

-   **`Character` (`src/types/character.ts`)**: Added `crypto?: number;`
-   **`ArsenalCard` & `ArsenalItem` (`src/types/arsenal.ts`)**: (No changes)
-   **`GameCard` (`src/components/card-generator/card-generator-ui.tsx`)**: (No changes)
-   **`EventsSheetData` (`src/components/events/events-sheet-ui.tsx`)**: (No changes)
-   **`InvestigationData` (`src/types/investigation.ts`)**: (No changes)
-   **`ItemGeneratorInput` & `ItemGeneratorOutput` (`src/ai/flows/item-generator-flow.ts`)**:
    -   **Input**: `itemType`, `theme?`, `rarity?`, `statFocus?`, `exampleItems?` (array of simple item objects), `loreContext?` (string).
    -   **Output**: `itemName`, `itemTypeGenerated`, `description`, `gameEffect`, `rarityGenerated?`.
-   **`GenerateShopItemImageInput` & `GenerateShopItemImageOutput` (`src/ai/flows/generate-shop-item-image-flow.ts`)**:
    -   **Input**: `itemName`, `itemDescription`, `itemCategory`, `itemSubCategory?`, `itemWeaponClass?`.
    -   **Output**: `imageDataUri`.
-   **`ShopItem` (`src/types/shop.ts`)**: (No changes to structure, but data source is Google Sheets)
-   **`AuthCredentials` & `SignUpCredentials` (`src/types/auth.ts`)**: (No changes)
-   **Dice Roller Types (`src/components/dice-roller/dice-roller-ui.tsx`)**: (No changes)
-   **`EventData` (`src/types/event.ts`)**: (No changes)

## 9. Firebase Rules, Cloud Functions, and APIs
(No changes from previous state)

## 10. Other Important Observations
-   The application heavily relies on client-side rendering for its UI components ("use client").
-   Server Components are used for page-level data fetching from Google Sheets.
-   The codebase has undergone significant refactoring to break down large UI components into smaller, more manageable sub-components.
-   Theming is centralized in `globals.css` and leverages ShadCN's HSL variable system.
-   Environment variables in `.env.local` are critical for Firebase client configuration and Google Sheets API server-side access.
-   Error handling is present for data fetching and Firebase operations, often using toast notifications.
-   The rulebook content provided by the user (shop items, abilities, combat rules) is extensive and implies a long-term goal of creating a very rich and interactive digital companion. Much of this is not yet implemented but informs the design of data structures.
-   The "Investigations" feature has been renamed to "NPC Generator".
-   Build process uses Firebase App Hosting buildpacks. Previous build issues related to dependencies (`firebase`, `@tanstack-query-firebase/react`, `@opentelemetry/exporter-jaeger`) and Next.js Suspense boundaries have been addressed.
-   The application is intended to be the "OFFICIAL Riddle of the Beast board game companion app."

This document provides a snapshot of the project's state and context.

    

