# Versed - Mobile App

**Your daily Bible companion**

Versed is a streamlined Bible reading and sharing app designed to make Scripture accessible, engaging, and shareable. Built with React Native and Expo Router.

## Features

### Core Experience

**Three Main Tabs:**

1. **Home** - Start your day with a Verse of the Day
   - Daily curated Scripture
   - Quick actions to read in Bible or share

2. **Share** - Create beautiful verse graphics
   - Customizable designs and presets
   - Share verses with friends and family
   - Multiple visual styles

3. **Bible** - Full-featured Bible reader
   - Multiple Bible versions (WEB, KJV, etc.)
   - Reading preferences (font size, dark/light mode)
   - Verse highlighting and notes
   - Journey integration for guided reading paths
   - AI-powered insights and main ideas
   - Reading stats and progress tracking

### Additional Features

- **Journeys** - Guided reading paths through specific books or themes
  - Track progress day by day
  - Visual journey paths
  - Completion celebrations

- **AI Chat** - Ask questions about Scripture with Ezra, your Bible study companion
  - Get main ideas for chapters
  - Understand difficult passages
  - Contextual explanations

- **Prayer** - Guided prayer experience
- **Quiz** - Test your Bible knowledge
- **Learn** - Educational content

## Tech Stack

- **Framework**: React Native with Expo Router
- **State Management**: Zustand for journey state
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: React Native StyleSheet with custom theme system
- **Navigation**: Expo Router (file-based routing)
- **Fonts**: Crimson Text (reading), Cormorant Garamond (display)

## Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main tab navigation
│   │   ├── home/          # Home tab
│   │   ├── share/         # Share tab
│   │   └── bible/         # Bible reader tab
│   ├── journey/           # Journey detail pages
│   ├── ai-chat/           # AI chat interface
│   ├── prayer/            # Prayer screen
│   └── onboarding/        # First-time user flow
├── components/            # Reusable UI components
│   ├── BibleReader/       # Bible reading components
│   └── ShareComposer/     # Verse sharing components
├── hooks/                 # Custom React hooks
├── utils/                 # Utilities and helpers
│   ├── auth/              # Authentication
│   ├── bible/             # Bible data and utilities
│   ├── journeys/          # Journey definitions and state
│   └── design/             # Theme and design tokens
```

## Streamlined Architecture

The app has been streamlined to focus on the core reading and sharing experience:

- **Removed**: Unused profile and journey tab routes
- **Kept**: Journey functionality integrated into Bible reader (via `journey/[id].jsx`)
- **Active**: Three main tabs (Home, Share, Bible) provide the primary user experience

Journey hooks and stores remain active as they power the guided reading experience within the Bible tab.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Environment Setup

See `BACKEND_SETUP.md` for backend configuration details.

## License

Proprietary - All rights reserved

