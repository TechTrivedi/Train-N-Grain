# Train N Grain — Project Diary & Interview Guide

This guide is structured as short, high-impact bullet points to copy directly into your project diary, along with technical deep dives to help you ace developer interviews.

---

## 🐣 Phase -1: The Pre-Development Foundation (How the Code Was Born)

Before we began the formal refactoring (Phase 0), the initial prototype was built from scratch using these core steps and technologies:

### 1. Architectural Core & Styling Setup
*   **Semantic HTML5 Markup**: Structured the site across three main pages:
    *   `index.html`: The landing page containing the Hero area, platform features, user transformations, and contact form.
    *   `fitness.html`: The fitness assessment form and workout output viewport.
    *   `nutrition.html`: The calorie calculator, veg/non-veg toggle, and meal plan cards.
*   **Modern CSS Styling**: Designed a responsive grid system and flexbox layouts inside `styles.css`. Defined global variables (colors, fonts, sizes) to support a dark-mode theme with glowing neon-green accents.

### 2. Firebase App & Auth Integration
*   **Firebase Project Creation**: Created a cloud project named **Train N Grain** on the Google Firebase console.
*   **SDK Setup (v8 Compat)**: Imported the Firebase App and Auth scripts via CDN and initialized the client configuration inside `firebase-config.js`.
*   **Auth UI Modals**: Designed the overlay login and signup forms with input validation fields (first name, last name, email, password) and custom styling.

### 3. Nutrition & Workout Formula Implementations
*   **BMR & TDEE Calculations**: Programmed the standard **Mifflin-St Jeor equation** inside `nutrition.js` to calculate Basal Metabolic Rate (BMR):
    *   *Male*: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} + 5$
    *   *Female*: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} - 161$
*   **TDEE Multiplier**: Mapped activity dropdowns (Sedentary, Lightly Active, Moderately Active, etc.) to corresponding multipliers (1.2 to 1.9) to obtain daily energy expenditure.
*   **Goal Adjustments & Macro Splits**: 
    *   *Bulk*: TDEE + 400 calories (Ratio: 30% Protein, 45% Carbs, 25% Fat).
    *   *Cut*: TDEE - 500 calories (Ratio: 40% Protein, 30% Carbs, 30% Fat).
    *   *Maintain*: TDEE (Ratio: 30% Protein, 40% Carbs, 30% Fat).

### 4. Static Program Layouts (The Mock Databases)
*   **Workout Matrix**: Drafted a hierarchical JavaScript object mapping out basic, standard workouts for beginner, intermediate, and advanced levels across different splits (strength, endurance, fat loss) and equipment (dumbbells, bodyweight, bands).
*   **Meal Database**: Compiled vegetarian and non-vegetarian food options (divided into breakfast, lunch, snacks, dinner) with estimated protein, carbohydrate, and fat values.

---

## 🛠️ The Tech Stack

*   **Frontend**: HTML5, Vanilla CSS3 (custom CSS variables, media queries), Vanilla ES6+ JavaScript.
*   **Database**: Cloud Firestore (Google Firebase NoSQL database) - handles real-time data persistence.
*   **Authentication**: Firebase Authentication (supporting Email/Password and Google OAuth sign-in).
*   **AI Integration**: Google Gemini API (`gemini-3.1-flash-lite` model for fast, cost-efficient, and secure processing).
*   **Backend Serverless**: Node.js running as serverless functions (secure proxies) to prevent API key exposure.
*   **Local Development**: Custom Node.js http server (`server.js`) to test serverless API routes locally without third-party frameworks.

---

## 📐 Key Architectural Decisions ("Why" & "How")

### 1. Decoupling & Modularization (Phase 0)
*   **Problem**: The original code had huge blocks of duplicate layouts, styles, and lookup arrays copy-pasted across `app.js`, `fitness.js`, and `nutrition.js`.
*   **Solution**: Decoupled database arrays into `workout-data.js` and `nutrition-data.js`. Extracted all shared UI handlers (hamburger menu, scroll reveal, scroll scroll effects, and custom toast alerts) into a single, global `shared.js` module.
*   **Why it matters**: It follows the **DRY (Don't Repeat Yourself)** principle. It reduces codebase size, prevents bugs (e.g. updating a menu helper in one place updates all pages), and speeds up page load times.

### 2. Backend API Proxy for AI Chatbot (Phase 1)
*   **Problem**: Frontends cannot safely make requests directly to the Gemini API. If the API key is placed in client-side JavaScript, anyone can inspect the page, steal the key, and abuse your account.
*   **Solution**: Built a secure Node.js serverless proxy in `api/chat.js` that intercepts client requests, appends the private `GEMINI_API_KEY` in the background, and forwards them to Google.
*   **Why it matters**: It is a critical industry security standard. It protects your credentials, controls request quotas, and lets you inject strict server-side rules (like off-topic blocking) that the user cannot edit or bypass.

### 3. Zero-Dependency Local Env Loader (YAGNI & Performance)
*   **Problem**: Normally, developers install heavy npm packages like `dotenv` to load local keys.
*   **Solution**: Wrote a custom, lightweight `.env` parser inside `api/chat.js` (lines 4-22) using native Node.js filesystem `fs` functions to read environment variables during local development.
*   **Why it matters**: Aligns with **YAGNI (You Aren't Gonna Need It)**. It avoids bloating `node_modules` with unnecessary third-party packages, reducing dependencies and vulnerabilities.

### 4. Cross-Platform Ready Firestore (Phase 3)
*   **Problem**: Transitioning from a website to a mobile app often requires rewriting databases.
*   **Solution**: Chose Cloud Firestore. 
*   **Why it matters**: Firestore is platform-agnostic. The exact same Firebase authentication and database records we use on the web today can be connected directly to your future iOS/Android app (e.g., React Native/Flutter) tomorrow, enabling seamless real-time data sharing.

---

## 📈 Timeline of Milestones (From Prototype to Today)

*   **Milestone 0: Structural Refactoring**
    *   Unified mobile menus and toasts into `shared.js`.
    *   Created `workout-data.js` and `nutrition-data.js` to modularize static lookups.
    *   Reduced controller files to less than 80 lines each.
*   **Milestone 1: AI Chatbot Setup**
    *   Created `api/chat.js` serverless function.
    *   Configured `.env` loader and modular `package.json`.
    *   Designed a glowing glassmorphic widget inside `chat.js` and `styles.css` containing scrollable lists, typing indicators, and slide animations.
*   **Milestone 2: Quota & Model Optimization**
    *   Discovered region-based `limit: 0` quota limits on preview models like `gemini-2.0-flash`.
    *   Wrote a local multi-model diagnostic script to isolate working channels.
    *   Optimized configuration to run on the highly available and stable `gemini-3.1-flash-lite` model.
    *   Built `server.js` to route backend API requests locally without complex local deployments.
*   **Milestone 3: Database & Multi-page Auth Sync**
    *   Initialized Firestore globally in `firebase-config.js`.
    *   Imported Firebase SDK and modal forms to `fitness.html` and `nutrition.html` to share sign-in states across pages.
    *   Programmed auto-saving and auto-loading rules in `fitness.js` and `nutrition.js` to save generated programs to Firestore.
    *   Added "Change Stats" toggles to let users edit stats and clear cards instantly on logout.
*   **Milestone 4: Password Security UI**
    *   Wrapped password fields on all pages inside a custom relative-positioned container.
    *   Created a custom SVG visibility button (open eye vs. slashed eye) that dynamically toggles password fields between `password` and `text` via `shared.js`.

---

## 🙋 Interview Core Questions & Answers

### Q: Why did you choose a NoSQL Database (Firestore) over a SQL Database (like MySQL/PostgreSQL) for this app?
> **Answer**: NoSQL databases are ideal for fitness and diet plan data because workout structures and macro profiles are naturally hierarchical and document-oriented. Saving a weekly workout program as a single nested document under `users/{uid}` is much faster and cleaner than writing complex SQL queries joining `users`, `workouts`, `days`, and `exercises` tables. It also allows us to quickly scale and change the schema without running database migrations.

### Q: How did you implement topic restrictions on the Gemini Chatbot?
> **Answer**: We implemented strict guardrails using the `systemInstruction` field in the Gemini API request body. By prepending a system prompt explaining: *"You are an AI fitness coach at Train N Grain. Politely but firmly decline to answer any questions unrelated to health, workouts, training, or diet,"* we created a server-side boundary. Even if the user tries to prompt-inject or ask about the weather, the Gemini model recognizes the instruction and maintains its coach persona.

### Q: Why did you use `onAuthStateChanged` instead of checking `auth.currentUser` on page load?
> **Answer**: Checking `auth.currentUser` synchronously during page load returns `null` because the Firebase SDK has to make an asynchronous network request to verify the browser's stored token. By registering a callback listener with `onAuthStateChanged`, the app gets notified automatically the exact millisecond the user session resolves, allowing us to update the navbar greeting and fetch saved database records.

### Q: How does the password visibility button toggle work without breaking form submissions?
> **Answer**: The button is configured with `type="button"`. In HTML, buttons inside forms act as `type="submit"` by default. If we didn't specify `type="button"`, clicking the eye icon would submit the login form and refresh the page instead of just toggling the input type.
