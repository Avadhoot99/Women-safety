# Women Safety App

## Overview
This is a web showcase of an Android Women Safety application (originally built with Java/Android). Since Android apps cannot run natively in a browser, the project has been set up as a faithful web recreation of the app's UI and functionality.

## Project Structure

```
/
├── server.js              # Node.js HTTP server (serves on port 5000)
├── web/
│   ├── index.html         # Main HTML — three screens: Main, Profile, Emergency
│   ├── style.css          # Dark-themed styling matching the Android app
│   └── app.js             # App logic: SOS, contacts, profile, navigation
├── app/                   # Original Android source code (Java)
│   └── src/main/
│       ├── java/com/example/womensafety/
│       │   ├── MainActivity.java
│       │   ├── EmergencyActivity.java
│       │   └── ProfileActivity.java
│       └── res/           # Android resources (layouts, drawables, etc.)
├── build.gradle.kts       # Root Gradle build file
└── settings.gradle.kts    # Gradle settings
```

## Android App Features (replicated in web)
- **SOS Button** — Sends emergency SMS with GPS location to all saved contacts
- **Profile** — Save name, age, blood group; manage emergency contacts
- **Emergency Info** — Safety instructions, emergency numbers (Police 112, Ambulance 102, Fire 101, Women Helpline 1091), useful websites
- **Quick Actions** — Call Emergency, Call Home (first contact), I'm Safe message, Help screen
- **Biometric auth**, **SMS**, **Location** permissions used in Android version

## Tech Stack (Web Showcase)
- **Runtime**: Node.js (built-in `http` module)
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Storage**: localStorage for profile and contacts
- **Server port**: 5000

## Running the App
The "Start application" workflow runs `node server.js` on port 5000.

## Deployment
Configured as `autoscale` with `node server.js` as the run command.
