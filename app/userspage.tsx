import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase'; // ✅ Import your Supabase client
import { router } from 'expo-router';
import { Bus, User, Lock, LogOut } from 'lucide-react-native'; // ✅ Added LogOut icon

const UsersPage = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return Alert.alert('Logout Error', error.message);
    router.replace('/'); // ✅ Redirect to Auth screen or Home
  };

  return (
    <ImageBackground
      source={require('../assets/images/yellowave.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <Text style={styles.heading}>Select Your Role</Text>

          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card}>
              <Bus color="black" size={36} />
              <Text style={styles.cardText}>Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.highlightCard]}>
              <User color="black" size={36} />
              <Text style={styles.cardText}>Passenger</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card}>
              <Lock color="black" size={36} />
              <Text style={styles.cardText}>Admin</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <LogOut color="#fff" size={20} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default UsersPage;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heading: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  cardContainer: {
    gap: 20,
  },
  card: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  highlightCard: {
    backgroundColor: '#fcf805',
  },
  cardText: {
    color: 'black',
    fontSize: 20,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 40,
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: 'black', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
