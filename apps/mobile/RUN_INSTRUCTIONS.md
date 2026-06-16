# NEXI Mobile App - Run Instructions

## Quick Start Options

### Option 1: Using Expo Go (Recommended for Testing)

**Prerequisites:**
- Node.js 18+ installed
- Expo Go app installed on your phone (iOS: App Store, Android: Google Play)
- Same WiFi network for phone and computer

**Steps:**

```bash
# 1. Navigate to mobile app directory
cd apps/mobile

# 2. Install dependencies
npm install --legacy-peer-deps --no-optional

# 3. Start the Expo development server
npm start

# 4. Scan the QR code with Expo Go
# - iOS: Open Expo Go → tap Scan QR Code
# - Android: Open Expo Go → tap "Scan QR Code"
# - Or type the URL in the Expo Go search bar
```

**Expected Output:**
```
> expo start

To open the app, scan the QR code above with Expo Go.

You can also press:
- a to open Android Emulator
- i to open iOS Simulator
- w to open web
```

---

### Option 2: Android Emulator

```bash
cd apps/mobile
npm install --legacy-peer-deps --no-optional
npm run android
```

---

### Option 3: iOS Simulator (macOS only)

```bash
cd apps/mobile
npm install --legacy-peer-deps --no-optional
npm run ios
```

---

## Troubleshooting

### Issue 1: Expo Go Version Mismatch
**Error:** `Unable to resolve 'react-native-gesture-handler'`

**Solution:**
- Update Expo Go to version 56.0.0 or later
- Or downgrade project: Edit `package.json` and change `"expo": "^56.0.0"` to `"expo": "^54.0.0"`

### Issue 2: npm install fails with dependency errors

**Solution A (Recommended):**
```bash
cd apps/mobile
npm install --legacy-peer-deps --no-optional --force
```

**Solution B:**
```bash
# Clear npm cache
npm cache clean --force

# Try yarn instead
yarn install
```

**Solution C:**
```bash
# Use npm ci instead
npm ci --legacy-peer-deps
```

### Issue 3: Metro bundler caching issues

```bash
# Clear Metro cache
npm start -- --clear

# Or
expo start -c
```

### Issue 4: Dependencies still not resolving

```bash
# Complete nuke and reinstall
rm -r node_modules package-lock.json
npm install --legacy-peer-deps --force
```

---

## Project Structure

```
apps/mobile/
├── App.tsx                 # Main app with Tab navigation
├── app/                    # Expo Router file-based routes
│   ├── index.tsx          # Home tab
│   ├── search.tsx         # Search tab
│   ├── saved.tsx          # Saved places tab
│   ├── rewards.tsx        # Rewards tab
│   └── profile.tsx        # Profile tab
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── RewardsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx     # Animated button
│   │   ├── Card.tsx       # Animated card
│   │   └── BusinessCard.tsx # Business listing card
│   ├── store/
│   │   └── appStore.ts    # Zustand global state
│   ├── theme/
│   │   └── colors.ts      # Design system colors
│   └── utils/
├── package.json
└── tsconfig.json
```

---

## Key Features

✅ **5 Bottom Tab Navigation:**
- Home: Discovery with trending businesses
- Search: Search & autocomplete ready
- Saved: Bookmarked places
- Rewards: Points & redemption system
- Profile: User account & settings

✅ **Smooth Animations:**
- Button press scale (0.95x)
- Card tap transitions
- Screen fade in/out
- Heart save button pop

✅ **Professional UI:**
- Dark theme with accent colors
- Responsive spacing & typography
- Verified badges
- Star ratings & reviews

---

## Available Scripts

```bash
npm start      # Start Expo development server
npm run android # Start Android Emulator
npm run ios    # Start iOS Simulator
npm run web    # Start web dev server
```

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Expo SDK | 56.0.0+ | React Native framework |
| React | 19.x | UI library |
| React Native | 0.85+ | Native bridge |
| React Native Reanimated | 3.11+ | 60fps animations |
| React Native Gesture Handler | 2.16+ | Touch interactions |
| Expo Router | 5.0+ | File-based routing |
| Zustand | 4.5+ | State management |
| TypeScript | 6.0+ | Type safety |

---

## Next Steps

1. ✅ App is fully functional with mock data
2. 📱 Test on device with Expo Go
3. 🔌 Connect to backend API (endpoints ready in code comments)
4. 🔐 Implement authentication (JWT structure prepared)
5. 💾 Add offline-first SQLite caching
6. 📦 Build native APK/IPA for app stores

---

## Support

For more details, see:
- [README.md](./README.md) - Comprehensive documentation
- [CLAUDE.md](./CLAUDE.md) - Architecture notes
- [AGENTS.md](./AGENTS.md) - Mobile-specific guidelines
