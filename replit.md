# SoulArt Temple - Chakra-Aligned Digital Sanctuary

## Overview

SoulArt Temple is a spiritual wellness web application designed as a chakra-aligned digital sanctuary. It helps users identify and release Stored Shadow Emotions through a variety of tools, including affirmations, guided emotional release statements, art meditation, journaling, and AI-powered guidance. The application features 7 sacred rooms, each corresponding to a chakra energy center, and includes a membership system with tiered access and Stripe payment integration. The project aims to provide a unique digital space for emotional healing and self-discovery.

## User Preferences

Preferred communication style: Simple, everyday language.
No emojis on buttons throughout the app - keep button text clean and simple.
Language standard: Always use "Stored Shadow Emotions" instead of "trapped emotions" throughout the application.

### Navigation Pattern (CRITICAL - Keep Consistent)

**Back Button Style:**
- Simple bordered button with light border (#ccc)
- No colored background or banner
- Text: "Back" (no arrow needed, or use ← if preferred)
- Clean, minimal appearance matching the cream/parchment background

**Member Icon:**
- Head and shoulders silhouette (person icon)
- Circular button with light border, no filled background
- Links to Members Dashboard if logged in, Login if not

**Header/Navigation Bar:**
- NO colored banners or headers (no blue, no dark backgrounds)
- Transparent background on navigation areas
- Clean, minimal look against cream/parchment page background
- Back button top-left, Member icon top-right (when both present)

### Visual Design Preferences

**Aesthetic Style:**
- Organic, handcrafted feel over sleek modern UI
- Warm, inviting atmosphere - like a sanctuary
- Polished but ancient - magical yet refined
- Fantasy-inspired without looking like a video game

**Color Palette:**
- Primary: Warm golden tones (#c9a227, #f4e4bc, #8b6914)
- Wood browns: Rich cedar/mahogany (#6a4b2a, #4a3520, #3a2815)
- Accents: Soft cream, warm amber, brass highlights
- Avoid: Cool blues, harsh contrasts, dark/moody unless specifically requested

**Textures & Effects:**
- Soft glowing effects (lantern-like warmth)
- Wood grain textures for navigation elements
- Parchment/scroll textures for content areas
- Subtle animations that feel gentle, not flashy

**Navigation Elements:**
- Signpost: Arrow-shaped wooden planks on a post (like fantasy trail markers)
- Map: Illustrated garden with invisible hotspots over buildings, parchment labels
- Buttons: Warm wood tones with brass accents, not flat UI buttons

**What to Avoid:**
- Top-down gaming/map aesthetic
- Flat modern UI design
- Harsh dark overlays that obscure imagery
- Generic button styles without character

**Design Communication Tips:**
- Reference images are extremely helpful ("make it look like THIS")
- Specify what to KEEP vs what to CHANGE
- Use mood words: warm, organic, glowing, ancient, handcrafted
- Say what NOT to do: "NOT modern, NOT gaming-style"

## System Architecture

The application employs a multi-page architecture with a Flask backend and HTML/CSS/JavaScript frontend. A clear visual design system, rooted in SoulArt branding, utilizes deep navy and gold/mustard tones, alongside chakra-based color coding. Layouts are responsive, using CSS Grid and a consistent header-nav-content structure.

### UI/UX Decisions

-   **Temple Entrance:** 7 chakra-aligned room tiles with hover glow effects.
-   **Discovery Portal:** Initiates users with shadow emotion category exploration.
-   **Quick Release Decoder:** Grid-based emotion buttons, affirmation selector, multi-select, and "Recoding After Release" section.
-   **Sacred Journal:** Serene UI with entry forms, emotion/tag/vibration selectors, reflection areas, and guided prompts.
-   **Art Meditation (Doodle Studio):** Full-featured tracing studio with template selector, drawing canvas, and tools panel (undo, clear, download, local storage persistence).
-   **SoulArt Guide:** AI chat interface with gentle, trauma-aware responses.
-   **Playroom:** Members-only hub for zen games (Lotus Breath, Chakra Flow, Zen Sand Garden).
-   **Landing Page:** Immersive, illustrated temple map with signpost navigation and interactive hotspots.
-   **Home Page:** Marketing-focused, featuring hero section, testimonials, booking, and contact forms.
-   **Membership Pages:** Login, registration, profile, and membership management with tiered access display.

### Technical Implementations

-   **Frontend:** HTML, CSS (responsive design, chakra-based colors), JavaScript (interactivity, canvas drawing, AI chat).
-   **Backend:** Flask handles API endpoints for journal CRUD, PDF generation, AI chat, booking, user authentication, and usage tracking.
-   **Data Management:** PostgreSQL (via SQLAlchemy) for persistent storage of user data, journal entries, and usage.
-   **Authentication:** Flask-Login with secure password hashing for email/password authentication.
-   **AI Integration:** Replit AI Integrations (OpenAI-compatible API) for the SoulArt Guide, using a custom system prompt.

### Feature Specifications

-   **Quick Release Decoder:** 12 core and 9 "Hidden Shadow" emotions with affirmations. Usage tracking and tier-based access limits.
-   **Sacred Journal:** Daily affirmations, emotion/frequency/vibration tags, four reflection areas, 37 prompts, PDF export.
-   **Education Centre:** Kinesiology resources (free for all).
-   **Art Meditation:** Free Doodle, Mandala Symmetry, and Trace Template modes with drawing tools and local storage.
-   **SoulArt Guide:** AI companion for Premium members.
-   **SoulArt Playroom:** Lotus Breath Guide, Chakra Flow Path, and Zen Sand Garden games for members.
-   **Premium Decoder Tools:** Emotion Decoder (7-step protocol), Allergy Decoder (7-step healing), Belief Decoder (8 categories) for Root Chakra.
-   **Medical Disclaimer:** Required acknowledgement at signup and on key pages, persisted via localStorage.
-   **Membership System:** Three tiers (Free, Essential, Premium) with Stripe integration and multi-month discounts.

## External Dependencies

-   **Authentication:** Flask-Login (with werkzeug password hashing).
-   **Database:** PostgreSQL (via SQLAlchemy ORM).
-   **PDF Generation:** WeasyPrint.
-   **AI Integration:** Replit AI Integrations (OpenAI-compatible API).
-   **Payment Processing:** Stripe (via Replit Stripe connector).