# 🏎️ Turbo Rush - Mobile Arcade Highway Racer

Turbo Rush is a high-octane 2D arcade racing game built with **React Native (CLI)**. Dodge dense highway traffic, perform high-speed near misses, collect coins and power-ups, activate nitro boost, unlock supercars in the garage, and compete for the highest distance record.

---

## 🎮 Game Features

- **High-Speed Highway Racing**: 3-lane vertical racing canvas with scrolling asphalt stripes and animated curbs.
- **Dynamic Car Physics**: Smooth spring-interpolated lateral lane shifting with dynamic vehicle lean and tilting.
- **Multiple Steering Modes**: Supports both **on-screen arcade touch buttons** (`◀` / `▶`) and **fluid swipe gestures** anywhere on the road.
- **Interactive Pedals**:
  - **⚡ NITRO Boost**: Twin cyan jet flames, increased speed multiplier, and dynamic speed motion.
  - **🛑 Dynamic Braking**: Illuminated brake lights and speed reduction to navigate tight traffic.
- **Near-Miss ("Close Call") System**: Passing within inches of traffic without crashing grants **+150 bonus points**, **+15% Nitro charge**, and an on-screen alert.
- **Power-Ups & Buffs**:
  - **🛡️ Shield**: Electric cyan dome that absorbs a crash and saves the car from game over.
  - **🧲 Coin Magnet**: Golden magnetic field attracting all coins across lanes.
  - **⚡ Nitro Canister**: Instantly refills the nitro tank to 100%.
- **Multiple Game Modes**:
  - **Endless Highway**: Infinite survival driving with progressive traffic density.
  - **Time Attack**: Reach distance checkpoints (+500m) to add +10s to the countdown timer.
  - **Speed Rush**: High-speed, heavy traffic challenge for veteran racers.
- **Car Garage**: Unlock and select from 5 distinct vehicles with unique speed, acceleration, handling, and nitro stats:
  - *Apex Turbo* (Balanced Street Runner)
  - *Neon Viper* (Electric High-Speed)
  - *Phantom Shadow* (Agile Drift Machine)
  - *Thunder GT* (Raw Horsepower Muscle)
  - *Cyber Valkyrie* (Hypercar Prototype)
- **Audio & Haptic Feedback**:
  - **Start Sound**: Authentic 251 KB car starter motor & ignition rev (`freesound_community_car_engine_start_44357.mp3`).
  - **Moving Sound**: Authentic 1.18 MB high-octane race car highway roar (`u_xg7ssi08yr_race_car_362035.mp3`) with dynamic volume scaling tied to speedometer velocity.
  - **Break / Brake Sound**: Realistic tire screech with persistent rubber skid marks left on the road asphalt.
  - **Car Crashing / Accident Sound**: Multi-stage 39.6 KB collision audio (sub-bass metal impact, metal crumpling, glass shatter, and decaying debris) paired with a full-screen red accident flash and 180° vehicle spin-out.
  - **Dash Boost Sound**: Roaring twin turbo acceleration and hyperspace speed warp streak lines.
  - **Arcade SFX**: Coin pickups, 3-2-1-GO countdown, power-up fanfares, menu buttons, and looping synthwave soundtrack with multi-pulse heavy haptics.
- **Cockpit Dashboard**:
  - 12-segment LED Tachometer / RPM rev gauge (1,400 to 9,000 RPM) with `🔥 REDLINE` alert above 7,600 RPM.
  - Digital transmission gear indicator (`GEAR 1` &rarr; `GEAR 6` / `TURBO`).
  - Real-time digital speedometer in KM/H.
  - Dash boost energy reservoir gauge with animated pulsing glow.
- **Combo Multiplier System**: `x2`, `x3`, `x4`, `x5 MAX COMBO` multipliers on consecutive close calls and coin pickups.
- **Local Storage Persistence**: Saves high scores, longest distance runs, coin balance, unlocked vehicle IDs, active car selection, and audio/haptic preferences locally via `@react-native-async-storage/async-storage`.

---

## 📁 Project Structure

```
CarRacing/
├── App.js                         # Root entry bridge
├── package.json                   # Dependencies & scripts
├── jest.config.js                 # Jest unit testing config
├── src/
│   ├── App.js                     # Safe area provider & navigation mount
│   ├── assets/
│   │   ├── fonts/                 # Custom racing typography
│   │   ├── images/                # Graphic assets (cars, roads, coins, obstacles)
│   │   └── sounds/                # 11 valid MPEG audio assets
│   │       ├── background_music.mp3
│   │       ├── brake.mp3
│   │       ├── button_click.mp3
│   │       ├── car_collision.mp3
│   │       ├── car_unlock.mp3
│   │       ├── coin_collect.mp3
│   │       ├── countdown.mp3
│   │       ├── engine_acceleration.mp3
│   │       ├── engine_idle.mp3
│   │       ├── game_over.mp3
│   │       └── game_start.mp3
│   │
│   ├── helpers/
│   │   ├── carsData.js            # Vehicle catalogue, prices & performance stats
│   │   ├── colorCodes.json        # Cyberpunk & racing color palette
│   │   ├── fontFamilys.json       # System & custom font mapping
│   │   ├── gameConstants.js       # Speeds, dimensions, powerup & near-miss configs
│   │   ├── gameLogic.js           # Bounding-box collisions, near-miss, score formulas
│   │   ├── navigation.js          # React Navigation Stack with fade transitions
│   │   ├── soundManager.js        # Native audio & haptic vibration manager
│   │   └── storage.js             # AsyncStorage typed data store
│   │
│   └── screens/
│       ├── SplashScreen.js        # Animated revving tachometer & storage bootstrapper
│       ├── HomeScreen.js          # Player records, vehicle showcase & Play buttons
│       ├── ModeSelectionScreen.js # Endless, Time Attack, and Speed Rush picker
│       ├── GarageScreen.js        # Vehicle selector, performance specs & purchasing
│       ├── GameScreen.js          # 60 FPS core racing canvas, HUD & controls
│       ├── PauseScreen.js         # In-race pause modal (Resume, Restart, Settings)
│       ├── GameOverScreen.js      # Post-crash score summary & high-score badge
│       ├── ResultsScreen.js       # Detailed metrics & coin rewards breakdown
│       └── SettingsScreen.js      # Audio, haptic toggles & progress reset
```

---

## 💾 Local Storage Keys

| Key | Type | Description |
| :--- | :--- | :--- |
| `bestScore` | `number` | Highest score achieved |
| `bestDistance` | `number` | Longest distance reached (meters) |
| `totalCoins` | `number` | Accumulated coin balance |
| `unlockedCars` | `string[]` | Array of unlocked vehicle IDs (`['car_01', ...]`) |
| `selectedCar` | `string` | Currently equipped vehicle ID |
| `musicEnabled` | `boolean` | Background soundtrack toggle |
| `effectsEnabled` | `boolean` | Sound effects toggle |
| `vibrationEnabled` | `boolean` | Haptic vibration toggle |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 22.11.0
- React Native CLI
- Android Studio & Android SDK (configured with `ANDROID_HOME`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Metro Dev Server
```bash
npm start
```

### 3. Run on Android Device or Emulator
```bash
npm run android
```

---

## 🧪 Testing & Code Quality

### Run Unit Tests (Jest)
```bash
npm test
```
*Executes collision detection, lane calculations, near-miss algorithms, and App render tests.*

### Run Linter (ESLint)
```bash
npm run lint
```
*Verifies 0 errors and 0 warnings across all code files.*

---

## 📦 Google Play Store Release Preparation

### 1. Build Android App Bundle (AAB)
```bash
cd android
./gradlew bundleRelease
```
*The generated `.aab` file will be located at:*  
`android/app/build/outputs/bundle/release/app-release.aab`

### 2. Android Manifest & Settings
- **Package ID**: `com.turborush.racing`
- **Orientation**: Locked to `portrait` for ideal vertical highway gameplay
- **Permissions**: `INTERNET`, `VIBRATE`
