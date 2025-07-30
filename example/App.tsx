import { GoogleSignin, GoogleSigninButton, User } from 'clay-google-signin';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, View, Image, StyleSheet, Alert } from 'react-native';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // It's crucial to configure Google Sign-In before using it.
    // You must provide your client IDs here.
    GoogleSignin.configure({
      webClientId: '436782923848-36ha03mmmf0bo14u98j1kk2uh25ufu4v.apps.googleusercontent.com', 
      iosClientId: '436782923848-frli7378n480vanv84ridjjs4pm1tv9n.apps.googleusercontent.com', 
    });
  }, []);

  const signIn = async () => {
    try {
      setIsSigningIn(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('userInfo', userInfo);
      setUser(userInfo);
    } catch (error: any) {
      console.log('error', error);
      // Don't alert if user cancels signin
      if (error.code !== '-5') {
          Alert.alert("Sign In Error", error.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInSilently = async () => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      setUser(userInfo);
       if (userInfo) {
        Alert.alert("Signed In Silently", `Welcome back, ${userInfo.name}`);
      } else {
        Alert.alert("Not Signed In", "No user session found.");
      }
    } catch (error: any) {
      Alert.alert("Silent Sign In Error", error.message);
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
  
  const revokeAccess = async () => {
    try {
      await GoogleSignin.revokeAccess();
      setUser(null);
    } catch (error: any) {
      Alert.alert('Revoke Access Error', error.message);
    }
  };

  const getCurrentUser = async () => {
    const currentUser = await GoogleSignin.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
        Alert.alert("Current User", `Logged in as ${currentUser.name}`);
    } else {
        Alert.alert("No Current User", "No user is currently signed in.");
    }
  };
  
  const getTokens = async () => {
    try {
      const tokens = await GoogleSignin.getTokens();
      Alert.alert('Tokens', JSON.stringify(tokens, null, 2));
    } catch (error: any) {
      Alert.alert('Get Tokens Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Clay Google Sign-In Example</Text>

        {user ? (
          <View style={styles.group}>
            <Text style={styles.groupHeader}>Welcome, {user.name}</Text>
            {user.photo && <Image source={{ uri: user.photo }} style={styles.profilePic} />}
            <Text>Email: {user.email}</Text>
            <Button title="Get Tokens" onPress={getTokens} />
            <Button title="Sign Out" onPress={signOut} />
            <Button title="Revoke Access" onPress={revokeAccess} />
          </View>
        ) : (
          <View style={styles.group}>
            <Text style={styles.groupHeader}>You are not signed in</Text>
            <GoogleSigninButton onPress={signIn} disabled={isSigningIn}/>
          </View>
        )}

        <Group name="Other Actions">
          <Button title="Check for Current User" onPress={getCurrentUser} />
          <Button title="Sign In Silently" onPress={signInSilently} />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    textAlign: 'center',
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '90%',
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 10,
  },
});
