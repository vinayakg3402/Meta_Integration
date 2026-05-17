# Facebook Login Fix — Complete Debugging Checklist

## The Error
"It looks like app isn't available. This app needs at least one supported permission."
from m.facebook.com

## What Caused It (3 issues working together)

### Issue 1: `setLoginBehavior('web_only')` — CODE FIX (already fixed in FacebookLogin.jsx)

Your code had this line:
```js
LoginManager.setLoginBehavior('web_only');
```

This forces the login through m.facebook.com's web dialog, which requires a
**"Website" platform** configured in your Meta Dashboard with a valid Site URL.
Since you're building a React Native mobile app, you don't have (or need) that.

**Fix:** Line removed. The SDK now uses native behavior automatically.

---

### Issue 2: Meta Developer Dashboard Configuration — YOU MUST DO THIS

Go to https://developers.facebook.com/apps/ → Select your app.

#### Step A: Verify "Facebook Login" product is added
1. Left sidebar → "Add Product" (if not already added)
2. Find "Facebook Login" → click "Set Up"
3. Choose "Android" and/or "iOS" (NOT "Web")

#### Step B: Configure your Android platform
1. Go to Settings → Basic → scroll to "Android"
2. If Android isn't listed, click "Add Platform" → Android
3. Fill in:

| Field                  | Where to find it                                |
|------------------------|-------------------------------------------------|
| Package Name           | Your `android/app/build.gradle` → `applicationId` (e.g. `com.yourapp`) |
| Default Activity Class | `com.yourapp.MainActivity`                      |
| Key Hashes             | See command below                               |

**Get your key hash (run this in terminal):**
```bash
# Debug key hash (for development)
keytool -exportcert -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android | openssl dgst -sha1 -binary | openssl base64

# Release key hash (for production)
keytool -exportcert -alias your-key-alias \
  -keystore /path/to/your-release-key.keystore | openssl dgst -sha1 -binary | openssl base64
```

**CRITICAL:** Add BOTH debug AND release key hashes. Missing key hash = silent failure.

#### Step C: Configure your iOS platform (if applicable)
1. Settings → Basic → scroll to "iOS"
2. If iOS isn't listed, click "Add Platform" → iOS
3. Fill in your **Bundle ID** (from Xcode → General → Bundle Identifier)

#### Step D: Verify Facebook Login settings
1. Left sidebar → Facebook Login → Settings
2. Check these are enabled:
   - "Client OAuth Login" = **Yes**
   - "Web OAuth Login" = **Yes** (needed for WebView fallback)
   - "Embedded Browser OAuth Login" = **Yes**
3. Do NOT need "Valid OAuth Redirect URIs" for native mobile apps

---

### Issue 3: App Mode & Tester Roles — YOU MUST CHECK THIS

1. Go to your app dashboard → top bar
2. Check if the toggle says "In Development" or "Live"

**If "In Development":**
- Only users added as Admin, Developer, or Tester can log in
- Everyone else sees "app isn't available"
- Go to App Roles → Roles → add yourself and team members as Testers
- They must accept the invitation at https://developers.facebook.com/requests/

**To go Live (for public users):**
1. Settings → Basic → fill in Privacy Policy URL (required)
2. App Review → submit for review with required permissions
3. Toggle the app to "Live" mode

---

## Android Native Config Files to Verify

### android/app/src/main/res/values/strings.xml
```xml
<resources>
    <string name="app_name">YourApp</string>
    <string name="facebook_app_id">YOUR_APP_ID_HERE</string>
    <string name="facebook_client_token">YOUR_CLIENT_TOKEN_HERE</string>
    <string name="fb_login_protocol_scheme">fbYOUR_APP_ID_HERE</string>
</resources>
```

Find your Client Token at: App Dashboard → Settings → Advanced → Client Token

### android/app/src/main/AndroidManifest.xml
Add inside `<application>`:
```xml
<meta-data
    android:name="com.facebook.sdk.ApplicationId"
    android:value="@string/facebook_app_id"/>
<meta-data
    android:name="com.facebook.sdk.ClientToken"
    android:value="@string/facebook_client_token"/>

<activity
    android:name="com.facebook.FacebookActivity"
    android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
    android:label="@string/app_name" />

<activity
    android:name="com.facebook.CustomTabActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="@string/fb_login_protocol_scheme" />
    </intent-filter>
</activity>
```

### android/app/build.gradle
Verify this is in dependencies:
```groovy
implementation 'com.facebook.android:facebook-android-sdk:latest.release'
```

---

## iOS Native Config Files to Verify (if building for iOS)

### ios/<YourApp>/Info.plist
Add these entries:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbYOUR_APP_ID_HERE</string>
    </array>
  </dict>
</array>
<key>FacebookAppID</key>
<string>YOUR_APP_ID_HERE</string>
<key>FacebookClientToken</key>
<string>YOUR_CLIENT_TOKEN_HERE</string>
<key>FacebookDisplayName</key>
<string>YourAppName</string>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
</array>
```

### ios/<YourApp>/AppDelegate.mm (or AppDelegate.m)
```objc
#import <FBSDKCoreKit/FBSDKCoreKit-swift.h>

// In didFinishLaunchingWithOptions:
[[FBSDKApplicationDelegate sharedInstance] application:application
    didFinishLaunchingWithOptions:launchOptions];

// Add this method:
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [[FBSDKApplicationDelegate sharedInstance] application:app
                                                       openURL:url
                                             sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                                                    annotation:options[UIApplicationOpenURLOptionsAnnotationKey]];
}
```

---

## Quick Verification After Fixes

1. Clean your build:
   ```bash
   # Android
   cd android && ./gradlew clean && cd ..

   # iOS
   cd ios && pod install && cd ..
   ```

2. Rebuild and run:
   ```bash
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

3. Tap "Continue with Facebook" → should see the proper OAuth consent screen

4. If it STILL fails, check the console for the exact error code — the
   `react-native-fbsdk-next` logs will show what the SDK received from Meta.

---

## Summary of All Changes

| What Changed                          | Where              | Why                                            |
|---------------------------------------|--------------------|-------------------------------------------------|
| Removed `setLoginBehavior('web_only')`| FacebookLogin.jsx  | Was forcing m.facebook.com which needs Web platform config |
| Added `Settings.setAppID()`           | FacebookLogin.jsx  | Ensures SDK knows which app to authenticate with |
| Added `LoginManager.logOut()` first   | FacebookLogin.jsx  | Prevents stale token conflicts                  |
| Simplified permissions to `['email']` | FacebookLogin.jsx  | `public_profile` is implicit; cleaner request   |
| Added error handling                  | FacebookLogin.jsx  | Better debugging for future issues              |
| Android key hash                      | Meta Dashboard     | Required for Android native login               |
| iOS bundle ID                         | Meta Dashboard     | Required for iOS native login                   |
| Facebook Login product                | Meta Dashboard     | Must be added and configured for mobile         |
| Tester roles                          | Meta Dashboard     | Development mode blocks non-testers             |
