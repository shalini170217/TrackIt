import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function DriversPage() {
  const [name, setName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingDriverId, setExistingDriverId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [routesWithStops, setRoutesWithStops] = useState<any[]>([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDriverDetails();
    return () => stopSharingLocation();
  }, []);

  const fetchDriverDetails = async () => {
    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) {
      setFetching(false);
      return Alert.alert('Error', 'User not authenticated');
    }

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error.message);
      Alert.alert('Error', error.message);
    }

    if (data) {
      setName(data.name);
      setBusNumber(data.bus_number);
      setPhoneNumber(data.phone);
      setExistingDriverId(data.id);
      fetchRoutesAndStops(data.id);
    }

    setFetching(false);
  };

  const fetchRoutesAndStops = async (driverId: string) => {
    const { data: routes, error } = await supabase
      .from('routes')
      .select('*, stops(*)')
      .eq('driver_id', driverId);

    if (error) {
      console.error(error.message);
      Alert.alert('Error', error.message);
      return;
    }

    setRoutesWithStops(routes || []);
  };

  const handleSaveDriver = async () => {
    if (!name.trim() || !busNumber.trim() || !phoneNumber.trim()) {
      return Alert.alert('Missing Info', 'Please fill all fields.');
    }

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) return Alert.alert('Error', 'User not authenticated');

    setLoading(true);
    let error;

    if (existingDriverId) {
      ({ error } = await supabase
        .from('drivers')
        .update({
          name: name.trim(),
          bus_number: busNumber.trim(),
          phone: phoneNumber.trim(),
        })
        .eq('id', existingDriverId));
    } else {
      const { data, error: insertError } = await supabase
        .from('drivers')
        .insert([
          {
            name: name.trim(),
            bus_number: busNumber.trim(),
            phone: phoneNumber.trim(),
            auth_id: user.id,
          },
        ])
        .select()
        .single();

      if (!insertError && data) {
        setExistingDriverId(data.id);
        fetchRoutesAndStops(data.id);
      }
      error = insertError;
    }

    setLoading(false);

    if (error) return Alert.alert('Error', error.message);

    Alert.alert('Success', existingDriverId ? 'Details updated' : 'Details saved');

    if (existingDriverId) fetchRoutesAndStops(existingDriverId);
  };

  const handleCreateRoute = () => {
    if (!existingDriverId) {
      return Alert.alert('Driver Not Saved', 'Save your details first.');
    }
    router.push({ pathname: '/createRoute', params: { driverId: existingDriverId } });
  };

  const startSharingLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'Location permission is required.');
    }

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user || !existingDriverId) return;

    const watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
      },
      async (location) => {
        await supabase.from('driver_locations').upsert({
          driver_id: existingDriverId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          updated_at: new Date().toISOString(),
        });
      }
    );

    setLocationWatcher(watcher);
  };

  const stopSharingLocation = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const toggleLocationSharing = () => {
    if (isSharingLocation) {
      stopSharingLocation();
    } else {
      startSharingLocation();
    }
    setIsSharingLocation((prev) => !prev);
  };

  const handleSend = async () => {
    if (message.trim() === '') {
      return Alert.alert('Empty', 'Please type a message.');
    }

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user || !existingDriverId) {
      return Alert.alert('Error', 'User not authenticated or driver details missing.');
    }

    const { error } = await supabase.from('driver_messages').insert([
      {
        driver_id: existingDriverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error(error);
      return Alert.alert('Error', 'Failed to send message.');
    }

    Alert.alert('Sent', 'Your message has been sent to passengers.');
    setMessage('');
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/yellowave.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={toggleLocationSharing}
          style={[
            styles.toggleButton,
            { backgroundColor: isSharingLocation ? '#28a745' : '#dc3545' },
          ]}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {isSharingLocation ? 'Sharing: ON' : 'My Location'}
          </Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.heading}>Driver Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Bus Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter bus number"
              value={busNumber}
              onChangeText={setBusNumber}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              placeholder="Enter your number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleSaveDriver}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : existingDriverId ? 'Update Details' : 'Save Driver'}
            </Text>
          </TouchableOpacity>

          {existingDriverId && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#fcf805', marginTop: 16 }]}
              onPress={handleCreateRoute}
            >
              <Text style={[styles.buttonText, { color: '#000' }]}>Create Route</Text>
            </TouchableOpacity>
          )}

          {routesWithStops.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.routesHeading}>Your Routes</Text>
              {routesWithStops.map((route) => (
                <View key={route.id} style={styles.routeCard}>
                  <Text style={styles.routeTitle}>🚌 {route.route_name}</Text>
                  {route.stops.length > 0 ? (
                    route.stops
                      .sort((a, b) => a.order - b.order)
                      .map((stop: any) => (
                        <Text key={stop.id} style={styles.stopText}>
                          📍 {stop.stop_name}
                        </Text>
                      ))
                  ) : (
                    <Text style={{ color: '#999', marginTop: 4 }}>No stops added yet</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#d1ae3b', marginTop: 20 }]}
            onPress={() => {
              if (!existingDriverId) {
                return Alert.alert('Driver Not Saved', 'Save your details first.');
              }
              router.push({ pathname: '/map', params: { driverId: existingDriverId } });
            }}
          >
            <Text style={styles.buttonText}>Start Journey Today</Text>
          </TouchableOpacity>

          <View style={styles.messageBox}>
            <Text style={styles.messageHeading}>Driver Message</Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                placeholder="Type a message to passengers..."
                multiline
                value={message}
                onChangeText={setMessage}
                style={styles.messageInput}
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContainer: { paddingVertical: 30 },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  routesHeading: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  routeCard: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  routeTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  stopText: { fontSize: 16, marginLeft: 6, marginBottom: 2 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 16, color: '#333' },
  required: { color: 'red' },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  toggleButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  messageBox: {
    backgroundColor: '#ede58c',
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  messageHeading: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  messageInputContainer: {
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 120,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    paddingRight: 10,
  },
  sendButton: {
    backgroundColor: '#5fa6ed',
    padding: 8,
    borderRadius: 50,
  },
});
