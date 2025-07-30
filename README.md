# Clay Google Sign-in

A React Native module for Google Sign-in. This module works for both iOS and Android.

## Installation

```sh
npm install clay-google-signin
```
or
```sh
yarn add clay-google-signin
```

This library comes with a config plugin that handles the native project configuration for you.

## Configuration

### Environment Variables

The config plugin requires the following environment variables to be set in your `.env` file:

```bash
EXPO_PUBLIC_REVERSED_CLIENT_ID=your_reversed_client_id_here
EXPO_PUBLIC_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
```

These values can be found in your `GoogleService-Info.plist` file:
- `REVERSED_CLIENT_ID`: The reversed client ID from your GoogleService-Info.plist
- `IOS_CLIENT_ID`: The iOS client ID from your GoogleService-Info.plist
- `GOOGLE_WEB_CLIENT_ID`: The web client ID from your GoogleService-Info.plist

{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}

### iOS

1.  Follow the [Google Sign-In for iOS integration guide](https://developers.google.com/identity/sign-in/ios/start-integrating) to get your `GoogleService-Info.plist` file.
2.  Place this file in the root of your project (e.g., alongside `App.js`). The config plugin will automatically copy this file to the native project and configure the required URL Schemes and Client ID in your `Info.plist`.
3.  Run `npx expo prebuild` to sync the native project files.

### Android

1.  Go to your project in the [Firebase console](https://console.firebase.google.com/).
2.  In your project settings, download the `google-services.json` file.
3.  Place this file in the root of your project (e.g., alongside `App.js`).
4.  The config plugin will automatically copy the file and configure Gradle during the prebuild process.
5.  Run `expo prebuild` to sync the changes.

## Usage

First, you need to configure the module, usually in your app's entry file.

```tsx
import { GoogleSignin } from 'clay-google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // client ID of type WEB for your server (needed to verify user ID and for offline access)
  iosClientId: 'YOUR_IOS_CLIENT_ID', // found in your GoogleService-Info.plist
});
```

Then, you can use the `GoogleSigninButton` component and the `GoogleSignin` API.

```tsx
import { GoogleSignin, GoogleSigninButton, User } from 'clay-google-signin';
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

function App() {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setUser(userInfo);
    } catch (error: any) {
      if (error.code !== '-5') { // -5 is user cancellation
        Alert.alert("Sign In Error", error.message);
      }
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUser(null);
    } catch (error: any) {
      Alert.alert('Sign Out Error', error.message);
    }
  };

  if (!user) {
    return (
      <View>
        <GoogleSigninButton onPress={signIn} />
      </View>
    );
  }

  return (
    <View>
      <Text>Welcome, {user.name}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  )
}
```

## API

The `GoogleSignin` object provides the following methods:

-   `hasPlayServices(params?: { showPlayServicesUpdateDialog: boolean }): Promise<boolean>` (Android only)
-   `configure(params: ConfigureParams): Promise<void>`
-   `signIn(): Promise<User>`
-   `signInSilently(): Promise<User | null>`
-   `signOut(): Promise<void>`
-   `revokeAccess(): Promise<void>`
-   `hasPreviousSignIn(): Promise<boolean>`
-   `getCurrentUser(): Promise<User | null>`
-   `getTokens(): Promise<{ idToken: string; accessToken: string }>`
-   `addScopes(scopes: string[]): Promise<User>`
-   `clearCachedAccessToken(token: string): Promise<void>`

See `src/ClayGoogleSignin.types.ts` for the shape of the `User` object and `ConfigureParams`.

## Troubleshooting

### Android Error 12502

This error indicates a mismatch between your app's signing certificate and the SHA-1 fingerprint registered in your Firebase project.

**Step 1: Get the SHA-1 Fingerprint**

1.  Navigate to the `android` directory of your project (e.g., `cd android`).
2.  Run the `./gradlew signingReport` command.
3.  In the output, find the `SHA-1` value for the `debug` variant and copy it.

**Step 2: Add the Fingerprint to Firebase**

1.  Open your project in the [Firebase console](https://console.firebase.google.com/).
2.  Go to **Project settings** > **General** tab.
3.  Scroll down to "Your apps" and select your Android app.
4.  Click **"Add fingerprint"** and paste the SHA-1 key you copied.
5.  Save your changes. It may take a few minutes for the new settings to apply.
6.  Rebuild your app.
