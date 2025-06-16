import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router'; // ✅ To navigate to Route creation screen

export default function DriversPage() {
  const [name, setName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingDriverId, setExistingDriverId] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchDriverDetails();
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
      console.log(error.message);
      Alert.alert('Error fetching driver details', error.message);
    }

    if (data) {
      setName(data.name);
      setBusNumber(data.bus_number);
      setPhoneNumber(data.phone);
      setExistingDriverId(data.id);
    }

    setFetching(false);
  };

  const handleSaveDriver = async () => {
    if (!name.trim() || !busNumber.trim() || !phoneNumber.trim()) {
      return Alert.alert('Missing Info', 'Please fill all the fields.');
    }

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) return Alert.alert('Error', 'User not authenticated');

    setLoading(true);

    let error;
    if (existingDriverId) {
      // Update existing driver
      ({ error } = await supabase
        .from('drivers')
        .update({
          name: name.trim(),
          bus_number: busNumber.trim(),
          phone: phoneNumber.trim(),
        })
        .eq('id', existingDriverId));
    } else {
      // Insert new driver
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
        setExistingDriverId(data.id); // Save the driver's id for route creation
      }
      error = insertError;
    }

    setLoading(false);

    if (error) return Alert.alert('Error', error.message);

    Alert.alert('Success', existingDriverId ? 'Driver details updated' : 'Driver details saved');
  };

  const handleCreateRoute = () => {
    if (!existingDriverId) {
      return Alert.alert('Driver Not Saved', 'Please save your details first.');
    }
    router.push({
      pathname: '/createRoute', // ✅ Make sure you have this route
      params: { driverId: existingDriverId }, // ✅ Pass driverId as route param
    });
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>Driver Details</Text>

        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Bus Number"
          value={busNumber}
          onChangeText={setBusNumber}
          style={styles.input}
        />
        <TextInput
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleSaveDriver}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : existingDriverId ? 'Update Details' : 'Save Driver'}</Text>
        </TouchableOpacity>

        {/* ✅ Show Create Route button only if driver is saved */}
        {existingDriverId && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#fcf805', marginTop: 16 }]}
            onPress={handleCreateRoute}
          >
            <Text style={[styles.buttonText, { color: '#000' }]}>Create Route</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingVertical: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
