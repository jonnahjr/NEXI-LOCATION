# Nexi Locate — Professional Mobile App (Expo)

Ethiopia's Digital Location Ecosystem - Built with React Native, Expo, Reanimated, and Zustand.

## ✨ Features

### Discovery Layer (MVP)
- 🔍 Intelligent search with autocomplete
- 📍 Nearby business discovery  
- ⭐ Ratings & reviews
- 🔖 Save favorite places
- 🎯 Category browsing

### Community Layer  
- 📝 Write & read reviews
- 📸 Upload photos & videos
- ✓ Check-in system
- 🏆 Community contributions

### Rewards Economy
- ⚡ Earn points for reviews, photos, check-ins
- 💰 Redeem via Telebirr, airtime, coupons
- 🎁 Level-based membership
- 📊 Transaction history

### Professional UI/UX
- 🎨 Clean dark mode design
- ✨ Smooth animations (Reanimated)
- 🎭 Professional components
- 📱 Fully responsive
- ♿ Accessible design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo Go app installed on device (matching SDK 56)
- npm or yarn

### Installation & Running

**Option 1: Direct from Workspace Root (Recommended)**

```powershell
# Install all dependencies
npm install

# Navigate to mobile app
cd apps/mobile

# Start development server
npm run start

# Or directly on device:
npm run android    # Android emulator/device
npm run ios        # iOS simulator/device (macOS only)
npm run web        # Web browser
```

**Option 2: From Mobile Directory**

```powershell
cd apps/mobile
npm install
npm run start
```

### Troubleshooting

**SDK Mismatch (You have Expo Go 54.0.8, app requires ~56)**

If you see a SDK mismatch error:

1. **Update Expo Go** (Recommended)
   - Open Play Store / App Store
   - Update Expo Go to latest version
   - Rescan QR code

2. **Clear Metro Cache** (if app won't load)
   ```powershell
   expo start -c
   ```

3. **Downgrade project to SDK 54** (if you can't update Expo Go)
   - Edit `package.json`:
     ```json
     "expo": "~54.0.8"
     ```
   - Run `npm install` again
   - Run `npm start`

**Other Issues**

```powershell
# Hard reset
npm run start -- --clear

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Check Expo status
expo status
```

## 📁 Project Structure

```
apps/mobile/
├── app/                    # Expo Router navigation
│   ├── index.tsx          # Home screen
│   ├── search.tsx         # Search screen
│   ├── saved.tsx          # Saved places
│   ├── rewards.tsx        # Rewards screen
│   └── profile.tsx        # Profile screen
│
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── RewardsScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── components/        # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── BusinessCard.tsx
│   │
│   ├── store/            # Zustand state
│   │   └── appStore.ts
│   │
│   ├── theme/            # Design system
│   │   └── colors.ts
│   │
│   └── utils/            # Utilities
│       └── (helpers)
│
├── assets/               # Images, icons, fonts
├── app.json             # Expo config
├── index.ts             # Entry point
├── App.tsx              # Root component
└── package.json         # Dependencies
```

## 🎯 Key Technologies

| Technology | Purpose |
|-----------|---------|
| **Expo SDK 56** | React Native runtime |
| **Expo Router** | File-based routing |
| **React Native Reanimated** | Smooth animations |
| **Zustand** | State management |
| **React Query** | Data fetching & caching |
| **React Navigation** | Tab & stack navigation |
| **Expo Vector Icons** | Professional icons |
| **React Native Gesture Handler** | Touch interactions |

## 📱 Navigation

**Bottom Tab Navigation (5 tabs):**
- 🏠 **Home** - Discovery & trending places
- 🔍 **Search** - Smart search with autocomplete
- 🔖 **Saved** - Your saved places
- ⚡ **Rewards** - Points & redemption
- 👤 **Profile** - User account & settings

## 🎨 Design System

**Colors:**
- Primary: `#3B82F6` (Blue)
- Accent: `#10B981` (Green)
- Gold: `#F59E0B` (Rewards)
- Danger: `#EF4444` (Red)
- Dark Background: `#0A0E1A`

**Typography:**
- Headings: Geo (800 weight)
- Body: Nunito (500 weight)
- Monospace: Space Mono

**Spacing System:**
- xs: 4px | sm: 8px | md: 12px | lg: 16px | xl: 20px | xxl: 24px | xxxl: 32px

## 🔄 State Management

Using **Zustand** for global state:

```typescript
import { useAppStore } from '../store/appStore';

const { user, businesses, savedPlaces, toggleSavedPlace } = useAppStore();
```

## 🎬 Animations

**Reanimated 3** for smooth 60fps animations:
- Scale transitions (button presses)
- Fade-in/fade-out entry animations
- Spring physics for bouncy effects
- Haptic feedback on interactions

## 📦 Build & Deployment

### Development Build (local testing)

```powershell
npm run start
# Then select Android, iOS, or Web
```

### Native Build (EAS Build)

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for Android
eas build --platform android --profile development

# Build for iOS (macOS only)
eas build --platform ios --profile development
```

### Web Build

```powershell
npm run web
# Runs on http://localhost:19006
```

## 🔐 Security & Best Practices

- JWT tokens for authentication (planned)
- Refresh token rotation (planned)
- Rate limiting on API calls (planned)
- Offline-first with SQLite caching (planned)
- Device tracking & audit logs (planned)

## 📊 Monitoring & Analytics

- Sentry for error tracking (planned)
- Custom analytics for user behavior (planned)
- Performance monitoring (planned)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both Android & iOS
4. Submit a pull request

## 📝 License

MIT - See LICENSE file

## 🆘 Support

**Having issues?**

1. Check this README's Troubleshooting section
2. Clear Metro cache: `expo start -c`
3. Check Expo docs: https://docs.expo.dev
4. Check GitHub issues: https://github.com/jonnahjr/NEXI-LOCATION/issues

---

**Built with ❤️ for Ethiopia's digital ecosystem**