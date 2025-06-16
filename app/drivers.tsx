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

export default function DriversPage() {
  const [name, setName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingDriverId, setExistingDriverId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [routesWithStops, setRoutesWithStops] = useState<any[]>([]);

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
      console.log(error.message);
      return Alert.alert('Error fetching routes', error.message);
    }

    setRoutesWithStops(routes || []);
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

    Alert.alert('Success', existingDriverId ? 'Driver details updated' : 'Driver details saved');

    if (existingDriverId) fetchRoutesAndStops(existingDriverId);
  };

  const handleCreateRoute = () => {
    if (!existingDriverId) {
      return Alert.alert('Driver Not Saved', 'Please save your details first.');
    }
    router.push({
      pathname: '/createRoute',
      params: { driverId: existingDriverId },
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
    <ImageBackground
          source={require('../assets/images/yellowave.jpg')}
          style={styles.background}
          resizeMode="cover"
        >
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>Driver Details</Text>

        {/* ✅ Name with required symbol */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            Name <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        {/* ✅ Bus Number with required symbol */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            Bus Number <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <TextInput
          placeholder="Enter bus number"
          value={busNumber}
          onChangeText={setBusNumber}
          style={styles.input}
        />

        {/* ✅ Phone Number with required symbol */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            Phone Number <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <TextInput
          placeholder="Enter your number"
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

        {/* ✅ ROUTES + STOPS DISPLAY */}
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
      </ScrollView>
    </SafeAreaView>
     </ImageBackground>
  );
}

const styles = StyleSheet.create({
   background: {
    flex: 1,
  },
  container: {
    flex: 1,
   
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
  routesHeading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  routeCard: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  stopText: {
    fontSize: 16,
    marginLeft: 6,
    marginBottom: 2,
  },
  labelContainer: {
    marginBottom: 4,
  },
  labelText: {
    fontSize: 16,
    color: '#333',
  },
  required: {
    color: 'red',
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
