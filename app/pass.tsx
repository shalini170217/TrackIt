import { StyleSheet, Text, View, Button ,ImageBackground } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

const PassScreen = () => {
  const router = useRouter();

  return (
    <ImageBackground 
     source={require("../assets/images/login2.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
    <View style={styles.container}>
      
      <Button title="My Profile" onPress={() => router.push('/passengers')} />
    </View>
    </ImageBackground>
  );
};

export default PassScreen;

const styles = StyleSheet.create({
     background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
