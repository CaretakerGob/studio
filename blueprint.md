
# Blueprint: Riddl of the Beast App Companion

## 1. App Name
Riddl of the Beast App Companion

## 2. Overview
A comprehensive digital companion application for the "Riddl of the Beast" (RotB) board game. This app aims to enhance the gameplay experience by providing players with essential tools, character management, and random event generation, all wrapped in a dark, horror-themed interface.

## 3. Core Features & Key Pages

### 3.1. Homepage (`/`)
- **Description:** Landing page providing an overview of the app and quick links to all major features.
- **Visuals:** Thematic background image, clear navigation cards for each feature.
- **Footer:** Links to Home, FAQ, Terms of Service (placeholder), Privacy Policy (placeholder).

### 3.2. Character Sheet (`/character-sheet`)
- **Description:** Digital management of player characters.
- **Functionality:**
    - Select from predefined character templates or a customizable "Custom Character".
    - View and track core stats (HP, Sanity, MV, DEF) with interactive trackers.
    - View character skills and their values.
    - Manage abilities (Actions, Interrupts, Passives, FREE Actions).
    - For Custom Characters:
        - Point-buy system for core stats.
        - Point-buy system for skills.
        - Purchase abilities from a master list.
    - Equip "Arsenal Cards" which can:
        - Provide global stat modifications.
        - Grant specific weapons that override base character weapons.
        - Include companion pets with their own trackable stats (HP, Sanity, MV, DEF) and abilities.
    - Save and load character configurations for logged-in users.
- **Data Source:** Predefined characters and base skills are hardcoded. Arsenal Cards are fetched from a Google Sheet. Saved character data is stored in Firestore for authenticated users.

### 3.3. Dice Roller (`/dice-roller`)
- **Description:** Versatile dice rolling tool.
- **Functionality:**
    - Roll various types of numbered dice (d4, d6, d8, d10, d100, d12, d20, custom sides).
    - Configure and roll multiple groups of numbered dice simultaneously.
    - Roll "Combat Dice" (custom 6-sided dice with image-based faces: 3x Sword & Shield, 1x Double Sword, 2x Blank).
    - Input for number of combat dice to roll (max 12).
    - Display of latest roll results (individual dice and totals/summaries).
    - Roll history for the last 20 rolls.
    - Reset buttons for numbered and combat dice sections.

### 3.4. Card Generator (`/card-generator`)
- **Description:** Draw random cards from various in-game decks.
- **Functionality:**
    - Select a deck from a dropdown menu (Event, Item, Madness, Clash, Combat).
    - Draw a random card from the selected deck.
    - Display the latest drawn card prominently with its image and details.
    - History of the last 2 previously drawn cards.
    - "Held Cards" section:
        - Cards marked as "holdable" are added to the player's hand.
        - Player can "play" a held card, moving it to the main display.
- **Data Source:** Sample card data (including image URLs) is currently hardcoded.

### 3.5. Events (`/item-list`)
- **Description:** Random event generator based on selected event color/type.
- **Functionality:**
    - Select event criteria from dropdowns:
        - Random Type: Random Event (Any Color), Random Chaos Event, Random Order Event.
        - Specific Chaos Colors.
        - Specific Order Colors.
    - Generate a single random event matching the criteria.
    - Display the selected event with a thematic background image based on its color.
    - History of the last 2 previously drawn events.
- **Data Source:** Event data (Color, Type, Description) is fetched from a Google Sheet.

### 3.6. Investigations (`/investigations`)
- **Description:** Generate random investigation encounters.
- **Functionality:**
    - Select a "Location Color" from a dropdown.
    - Roll a 1d6 for the selected location.
    - Display the specific encounter details (NPC, Unit, Persona, Demand, Skill Check, Goals, Passive, Description) matching the color and dice roll.
- **Data Source:** Investigation encounter data is fetched from a Google Sheet.

### 3.7. Item List (`/events`)
- **Description:** A placeholder page intended for viewing a list of game items.
- **Functionality:** Currently displays an empty table structure. (Data source for actual items is not yet integrated).

### 3.8. User Profile (`/profile`)
- **Description:** Manage user account and saved data.
- **Functionality:**
    - User authentication (Sign Up, Log In, Log Out) via Firebase Authentication.
    - View and edit display name.
    - Upload and change profile picture (saved to Firebase Storage).
    - "Change Password" option (sends a password reset email).
    - Manage Saved Characters:
        - List saved characters with name, base template, avatar, and last saved date.
        - Load a saved character onto the Character Sheet.
        - Rename saved characters.
        - Duplicate saved characters.
        - Delete saved characters (with confirmation).
        - Set a character as default (preference saved to Firestore).
    - Simulated friends list with online status indicators (placeholder).

### 3.9. Shared Space (`/shared-space`)
- **Description:** Placeholder for a collaborative session feature.
- **Functionality:**
    - Enter an access code to "join" a session.
    - Access code is currently hardcoded for demonstration (`BEAST_PARTY`).
    - Displays a placeholder message for shared content upon successful "join".

### 3.10. FAQ (`/faq`)
- **Description:** Frequently Asked Questions page.
- **Functionality:**
    - Displays FAQs categorized into "App Questions" and "Board Game Concepts".
    - Uses an accordion style for readability.

## 4. Style Guidelines
- **Main Background:** Dark grey (`#333333`, HSL `0 0% 20%`)
- **Secondary Background Elements (Cards, Panels):** Darker grey (`#222222`, HSL `0 0% 13.3%`)
- **Text Color:** Light grey (`#EEEEEE`, HSL `0 0% 93%`)
- **Accent Color (Interactive Elements, Warnings, Highlights):** Blood red (`#FF0000`, HSL `0 100% 50%`)
- **Theme:** Dark and gritty atmosphere, with subtle background textures.
- **UI Components:** Primarily ShadCN UI components, styled with Tailwind CSS according to the theme.
- **Icons:** Lucide-React for most in-app icons.

## 5. Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, ShadCN UI (with custom theming via `globals.css`)
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Firebase Firestore (for user-specific data like saved characters, preferences)
- **Storage:** Firebase Storage (for user profile images)
- **Data Fetching (External):** Google Sheets API (for Events, Investigations, Arsenal Cards)
- **AI (Planned):** Genkit (not yet implemented for core features but available in stack)

## 6. Navigation
- **Sidebar:** Persistent sidebar providing links to all major features.
- **Homepage Cards:** Feature cards on the homepage also link to major sections.

## 7. Future Considerations / Enhancements (Potential)
- Implement full real-time collaboration for the "Shared Space".
- Integrate Genkit for AI-powered features (e.g., dynamic content generation, NPC interaction).
- Develop a proper backend for managing friend lists and real-time presence.
- Add more detailed item database and display for the "Item List" page.
- Implement advanced filtering and sorting for tables (Events, Investigations, Item List).
- Expand character progression options (e.g., experience, leveling).
- Add a bestiary or monster manual section.
- Implement game rule references or a digital rulebook.
- Caching strategies for Google Sheet data to improve performance.
```