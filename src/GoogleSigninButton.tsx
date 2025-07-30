import { GestureResponderEvent, View, Text, StyleSheet, Pressable } from 'react-native';
import { GoogleSignin } from './GoogleSigninModule';
import { GoogleSigninButtonProps } from './GoogleSignin.types';
import * as React from 'react';

export function GoogleSigninButton(props: GoogleSigninButtonProps) {
  const { onPress, style, disabled } = props;

  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
    if (disabled) return;
    GoogleSignin.signIn().catch((err: any) => {
      // Don't log error if user cancels signin
      if (err.code !== '-5') {
        console.error('google signin error', err);
      }
    });
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled} style={[styles.container, style]}>
      <View style={styles.viewContainer}>
        <Text style={styles.text}>
          Sign in with Google
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
    container: {
        width: 220,
        height: 48,
        marginVertical: 10,
    },
    viewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4285F4',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 4,
        flex: 1,
    },
    text: {
        color: 'white', 
        fontSize: 16, 
        fontWeight: 'bold'
    }
}) 