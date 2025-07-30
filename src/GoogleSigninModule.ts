import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';
import { User } from './GoogleSignin.types';

const ClayGoogleSignin = requireNativeModule('ClayGoogleSignin');

type ConfigureParams = {
  webClientId?: string;
  forceCodeForRefreshToken?: boolean;
  accountName?: string;
  iosClientId?: string;
  scopes?: string[];
  profileImageSize?: number;
};

export const GoogleSignin = {
  hasPlayServices: (params = { showPlayServicesUpdateDialog: true }): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return Promise.resolve(true);
    }
    return ClayGoogleSignin.hasPlayServices(params);
  },
  configure: (params: ConfigureParams = {}): Promise<void> => {
    return ClayGoogleSignin.configure(params);
  },
  signIn: (): Promise<User> => {
    return ClayGoogleSignin.signIn();
  },
  addScopes: (scopes: string[]): Promise<User> => {
    return ClayGoogleSignin.addScopes(scopes);
  },
  signInSilently: (): Promise<User | null> => {
    return ClayGoogleSignin.signInSilently();
  },
  signOut: (): Promise<void> => {
    return ClayGoogleSignin.signOut();
  },
  revokeAccess: (): Promise<void> => {
    return ClayGoogleSignin.revokeAccess();
  },
  hasPreviousSignIn: (): Promise<boolean> => {
    return ClayGoogleSignin.hasPreviousSignIn();
  },
  getCurrentUser: (): Promise<User | null> => {
    return ClayGoogleSignin.getCurrentUser();
  },
  clearCachedAccessToken: (token: string): Promise<void> => {
    return ClayGoogleSignin.clearCachedAccessToken(token);
  },
  getTokens: (): Promise<{ idToken: string; accessToken: string }> => {
    return ClayGoogleSignin.getTokens();
  },
};
