# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A cross-platform fitness center application built with React 18, Vite, and Capacitor. Runs on web, iOS, and Android from a single codebase, with Claude Agent SDK integration for AI-powered features.

## Development Commands

### Web Development
```bash
npm run dev          # Start development server on port 3000
npm run build        # Build for production (web only)
npm run preview      # Preview production build
```

### Mobile Development
```bash
npm run build:mobile # Build web app and sync to native platforms
npm run sync         # Sync web code to native platforms (after build)
npm run android      # Open Android project in Android Studio
npm run ios          # Open iOS project in Xcode (macOS only)
```

### Mobile Development Workflow
1. Make changes to React code in `src/`
2. Run `npm run build:mobile` to build and sync
3. Open native IDE with `npm run android` or `npm run ios`
4. Run/debug from Android Studio or Xcode

**Requirements:**
- **Android:** Android Studio installed
- **iOS:** macOS with Xcode installed (iOS development only possible on macOS)

## Tech Stack

- **Frontend:** React 18.3.1, Vite 5.4
- **Mobile:** Capacitor 7.4 (iOS & Android native bridge)
- **AI Integration:** Claude Agent SDK 0.1.58

## Project Structure

```
fitness-center/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page-level components
│   ├── styles/         # CSS files
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── main.jsx        # Application entry point
│   └── App.jsx         # Root component
├── android/            # Android native project (managed by Capacitor)
├── ios/                # iOS native project (managed by Capacitor)
├── public/             # Static assets
├── dist/               # Build output (web bundle)
├── capacitor.config.json  # Capacitor configuration
├── index.html          # HTML template
└── vite.config.js      # Vite configuration
```

## Architecture

This is a cross-platform application using:
- **React** for UI components (single codebase)
- **Vite** for fast builds and dev server
- **Capacitor** to wrap the web app into native iOS/Android apps

### Capacitor Integration
- Web code is built into `dist/` directory
- Capacitor syncs `dist/` to native platform projects
- Native platforms (`android/`, `ios/`) contain platform-specific code
- Capacitor plugins provide access to native device features (camera, geolocation, etc.)

### Claude Agent SDK
Available for AI-powered features:
- Conversational interfaces for class bookings and trainer scheduling
- Intelligent workout recommendations
- Natural language queries for gym information

### Key Architectural Notes
- Single codebase for web, iOS, and Android
- Component-based React architecture
- Mobile-first responsive design
- Native functionality via Capacitor plugins
- Hot reload for web development, native IDE for mobile debugging
