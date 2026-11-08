# Cerebra — Native Android Application (Kotlin + Jetpack Compose + Material 3)

This directory contains the native Android source code for **Cerebra**, featuring 10 cognitive games and 10,000 deterministically generated levels across 10 mastery tiers.

## How to Build the `.apk` for Your Android Device

### Method 1: Android Studio (Recommended)
1. Open **Android Studio** (Ladybug / Koala or newer).
2. Select **Open** and choose this `android/` folder.
3. Let Gradle sync complete, then click **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. Your installable APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
5. Transfer `app-debug.apk` to your Android phone via USB or Google Drive and tap to install.

### Method 2: Command Line (Gradle)
If you have JDK 17 and the Android SDK installed:
```bash
cd android
gradle testDebugUnitTest assembleDebug
```
The APK will be located at `app/build/outputs/apk/debug/app-debug.apk`.

### Method 3: Cloud Build via GitHub Actions (Zero Local SDK Required)
Push this repository to GitHub. The included workflow at `.github/workflows/build-apk.yml` automatically provisions JDK 17 + Android SDK, runs the 10,000-level JUnit test suite, compiles `app-debug.apk`, and attaches it as a downloadable build artifact.
