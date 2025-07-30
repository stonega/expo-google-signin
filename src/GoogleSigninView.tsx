import { requireNativeView } from 'expo';
import * as React from 'react';

import { GoogleSigninButtonProps } from './GoogleSignin.types';

const NativeView: React.ComponentType<GoogleSigninButtonProps> =
  requireNativeView('ClayGoogleSignin');

export default function ClayGoogleSigninButton(props: GoogleSigninButtonProps) {
  return <NativeView {...props} />;
}
