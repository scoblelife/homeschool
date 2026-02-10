# App Store Assets

This directory contains metadata and assets for App Store and Play Store submissions.

## Current Assets

- `appstore-description.txt` - iOS App Store full description
- `playstore-description.txt` - Google Play Store full description
- `short-description.txt` - Short tagline (80 chars max)
- `metadata.json` - Structured metadata (categories, keywords, URLs)

## Required Screenshots

### iOS App Store

Screenshots must be provided for each device size:

| Device         | Size (pixels) | Count |
| -------------- | ------------- | ----- |
| iPhone 6.7"    | 1290 x 2796   | 2-10  |
| iPhone 6.5"    | 1242 x 2688   | 2-10  |
| iPhone 5.5"    | 1242 x 2208   | 2-10  |
| iPad Pro 12.9" | 2048 x 2732   | 2-10  |

**Recommended screenshots:**

1. Dashboard with today's activities
2. Quick activity logging
3. Streak and achievements view
4. Reports/portfolio generation
5. Student management

### Google Play Store

| Type       | Size (pixels) | Count          |
| ---------- | ------------- | -------------- |
| Phone      | 1080 x 1920   | 2-8            |
| 7" Tablet  | 1200 x 1920   | 2-8 (optional) |
| 10" Tablet | 1800 x 2560   | 2-8 (optional) |

**Feature Graphic (required):**

- Size: 1024 x 500 pixels
- Used for Play Store header

## Icon Requirements

### iOS App Icon

The main `icon.png` (1024x1024) is used by Expo to generate all required sizes:

- 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt (at 1x, 2x, 3x scales)

### Android Adaptive Icon

- `adaptive-icon.png` (1024x1024) - Foreground layer with transparency
- Background color defined in `app.json`

### Generating Screenshots

Use Expo's screenshot feature or the iOS Simulator/Android Emulator:

```bash
# iOS Simulator
xcrun simctl io booted screenshot screenshot.png

# Android
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

Or use Expo Dev Client:

1. Run `npm run mobile:ios` or `npm run mobile:android`
2. Navigate to each screen
3. Take screenshots using device controls

## Submitting to Stores

See `eas.json` for EAS Submit configuration.

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```
