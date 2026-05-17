import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────
//  IMPORTANT: Replace with YOUR Facebook App ID
//  This must match the value in:
//    - Android: android/app/src/main/res/values/strings.xml
//    - iOS:     ios/<YourApp>/Info.plist
// ─────────────────────────────────────────────────────────
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID_HERE';

const FacebookLogin = () => {

  const handleFBLogin = useCallback(async () => {
    console.log('Facebook login started');

    try {
      // ─────────────────────────────────────────────────────
      //  FIX 1: Initialize the SDK with your App ID
      //  Without this, the SDK may not know which app to use
      // ─────────────────────────────────────────────────────
      Settings.setAppID(FACEBOOK_APP_ID);

      // ─────────────────────────────────────────────────────
      //  FIX 2: REMOVED setLoginBehavior('web_only')
      //
      //  'web_only' forces m.facebook.com which requires a
      //  "Website" platform in your Meta Dashboard. For React
      //  Native mobile apps, let the SDK pick the best method:
      //    - Uses Facebook app if installed (fastest)
      //    - Falls back to in-app WebView if not
      //
      //  DO NOT add this line back:
      //  LoginManager.setLoginBehavior('web_only');  // REMOVED
      // ─────────────────────────────────────────────────────

      // ─────────────────────────────────────────────────────
      //  FIX 3: Log out any previous session first
      //  Prevents stale token conflicts
      // ─────────────────────────────────────────────────────
      LoginManager.logOut();

      // ─────────────────────────────────────────────────────
      //  FIX 4: Request permissions correctly
      //  'public_profile' is granted by default — you don't
      //  need to list it explicitly. Adding only 'email' here.
      //  Add more scopes later as needed (pages_show_list, etc.)
      // ─────────────────────────────────────────────────────
      const result = await LoginManager.logInWithPermissions(['email']);

      if (result.isCancelled) {
        console.log('Login cancelled by user');
        Alert.alert('Cancelled', 'Login was cancelled.');
        return;
      }

      // ─────────────────────────────────────────────────────
      //  FIX 5: Null-check the token properly
      // ─────────────────────────────────────────────────────
      const tokenData = await AccessToken.getCurrentAccessToken();

      if (!tokenData) {
        console.log('No access token received');
        Alert.alert('Error', 'Failed to get access token. Please try again.');
        return;
      }

      const accessToken = tokenData.accessToken.toString();
      const userId = tokenData.userID;
      const expirationTime = tokenData.expirationTime;

      console.log('Facebook Access Token:', accessToken);
      console.log('User ID:', userId);
      console.log('Token expires:', expirationTime);

      Alert.alert('Success', `Logged in as user ${userId}`);

      // ─────────────────────────────────────────────────────
      //  TODO: Send this token to your backend
      //  Example:
      //
      //  await fetch('https://your-backend.com/api/auth/facebook', {
      //    method: 'POST',
      //    headers: { 'Content-Type': 'application/json' },
      //    body: JSON.stringify({ accessToken, userId }),
      //  });
      // ─────────────────────────────────────────────────────

    } catch (error) {
      console.error('Facebook login error:', error);

      // ─────────────────────────────────────────────────────
      //  FIX 6: Better error messages for common failures
      // ─────────────────────────────────────────────────────
      const msg = error?.message || 'Unknown error';

      if (msg.includes('CONNECTION_FAILURE')) {
        Alert.alert('Network Error', 'Please check your internet connection.');
      } else if (msg.includes('canceled') || msg.includes('cancelled')) {
        Alert.alert('Cancelled', 'Login was cancelled.');
      } else {
        Alert.alert('Login Failed', msg);
      }
    }
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.fbButton}
          onPress={handleFBLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue with Facebook</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  fbButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FacebookLogin;
