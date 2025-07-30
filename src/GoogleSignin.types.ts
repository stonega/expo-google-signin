import type { StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';

export type User = {
  id: string | null;
  name: string | null;
  email: string | null;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
  idToken: string | null;
  serverAuthCode: string | null;
};

export type GoogleSigninButtonProps = {
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
};
