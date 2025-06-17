import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
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
      {/* My Profile button at top-right */}
      <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/passengers')}>
        <Text style={styles.profileButtonText}>My Profile</Text>
      </TouchableOpacity>

      {/* View My Bus button centered */}
      <View style={styles.centerContainer}>
        <TouchableOpacity style={styles.viewBusButton} onPress={() => router.push('/view-bus')}>
          <Text style={styles.viewBusButtonText}>View My Bus</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default PassScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#00000080',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBusButton: {
    backgroundColor: '#fcba03',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  viewBusButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
