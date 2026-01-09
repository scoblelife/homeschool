# Beta Distribution Guide

This guide explains how to set up and distribute beta versions of the Homeschool mobile app to testers.

## Prerequisites

### 1. Expo Account Setup

1. Create an Expo account at https://expo.dev
2. Create a new project or link existing: `eas init`
3. Generate an access token at https://expo.dev/accounts/[username]/settings/access-tokens
4. Add the token to GitHub secrets as `EXPO_TOKEN`

### 2. Apple Developer Account (iOS)

Required for iOS builds and TestFlight distribution.

1. Enroll in Apple Developer Program ($99/year): https://developer.apple.com/programs/
2. Create an App ID in App Store Connect
3. Note your:
   - Apple ID email
   - App Store Connect App ID (numeric)
   - Team ID

Add these to GitHub secrets:
- `APPLE_ID` - Your Apple ID email
- `ASC_APP_ID` - App Store Connect App ID
- `APPLE_TEAM_ID` - Team ID

### 3. Google Play Developer Account (Android)

Required for Play Store distribution.

1. Register for Google Play Developer ($25 one-time): https://play.google.com/console
2. Create your app in the Play Console
3. Create a service account:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Create Service Account with "Service Account User" role
   - Download JSON key file
   - In Play Console, add service account email with "Release Manager" permission

Add service account JSON to your repo as `mobile/play-store-service-account.json` (gitignored) or use EAS Secrets.

## Build Profiles

### Development Build
For local testing with development client:
```bash
cd mobile
eas build --profile development --platform ios    # iOS Simulator
eas build --profile development --platform android # APK for testing
```

### Preview Build
For internal testing with real devices:
```bash
eas build --profile preview --platform all
```

### Production Build
For store submission:
```bash
eas build --profile production --platform all
```

## Distribution Methods

### Method 1: EAS Internal Distribution (Recommended for Testing)

Best for quick iteration with internal testers.

1. **Build with internal distribution:**
   ```bash
   eas build --profile preview --platform all
   ```

2. **Share the build:**
   - EAS provides a QR code and URL after build completes
   - Testers scan QR code or open URL on their device
   - iOS: Requires device registration (EAS handles this automatically)
   - Android: Direct APK download

3. **Register iOS devices:**
   ```bash
   eas device:create  # Registers a new device
   eas device:list    # List registered devices
   ```

### Method 2: TestFlight (iOS)

Best for wider iOS beta testing (up to 10,000 testers).

1. **Build and submit to TestFlight:**
   ```bash
   eas build --profile production --platform ios
   eas submit --platform ios --latest
   ```

2. **Set up TestFlight:**
   - Go to App Store Connect > Your App > TestFlight
   - Create internal or external testing groups
   - Add testers by email

3. **Invite testers:**
   - Internal testers: Automatically get access
   - External testers: Receive email invitation to join TestFlight

4. **Testers install:**
   - Download TestFlight app from App Store
   - Accept invitation and install beta app

### Method 3: Google Play Internal Testing (Android)

Best for wider Android beta testing.

1. **Build and submit:**
   ```bash
   eas build --profile production --platform android
   eas submit --platform android --latest --profile preview
   ```

2. **Set up Internal Testing:**
   - Go to Play Console > Your App > Testing > Internal testing
   - Create a release from the uploaded build
   - Add testers by email (must use Gmail accounts)

3. **Testers install:**
   - Join via the opt-in link you share
   - Install from Play Store (shows as "You're a tester")

### Method 4: Direct APK Distribution (Android Only)

For quick sharing without Play Store.

1. **Build APK:**
   ```bash
   eas build --profile preview --platform android
   ```

2. **Download and share:**
   - Download the APK from EAS build page
   - Share via email, Google Drive, or direct link
   - Testers enable "Install from unknown sources" and install

## CI/CD Automation

### Automatic Preview Builds

The GitHub Actions workflow automatically builds preview versions when:
- Code is pushed to `main` branch
- Changes are in the `mobile/` directory

### Manual Builds

Trigger a build manually from GitHub Actions:
1. Go to Actions > Mobile Build
2. Click "Run workflow"
3. Select platform, profile, and whether to submit

### Required GitHub Secrets

Add these secrets to your repository:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token |
| `APPLE_ID` | Apple Developer email |
| `ASC_APP_ID` | App Store Connect App ID |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

For Android submission, add the service account JSON as an EAS secret:
```bash
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT --type file --value ./play-store-service-account.json
```

## Testing Checklist

Before each beta release:

- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] App launches successfully on both platforms
- [ ] Database initializes correctly
- [ ] Students can be created/edited
- [ ] Activities can be logged
- [ ] Milestones can be viewed and updated
- [ ] Field trips can be created
- [ ] Data persists across app restarts

## Versioning

Version is managed in `app.json`:
```json
{
  "expo": {
    "version": "0.1.0"  // Display version
  }
}
```

EAS auto-increments build numbers. To set manually:
```bash
eas build:version:set --platform ios --build-number 5
eas build:version:set --platform android --version-code 5
```

## Troubleshooting

### iOS Build Fails
- Ensure Apple Developer membership is active
- Check that App ID exists in App Store Connect
- Verify credentials with `eas credentials`

### Android Build Fails
- Check package name matches Play Console app
- Verify service account has correct permissions

### Testers Can't Install
- iOS: Verify device is registered (`eas device:list`)
- Android: Ensure APK is not corrupted, check min SDK version

### Updates Not Showing
- Clear app cache on device
- Uninstall and reinstall the app
- Check that you're on the correct testing track

## Quick Commands Reference

```bash
# Check build status
eas build:list

# Download latest build
eas build:download --platform ios --latest
eas build:download --platform android --latest

# View credentials
eas credentials

# Register iOS device
eas device:create

# Create and push update (for OTA updates)
eas update --channel preview --message "Bug fixes"
```
