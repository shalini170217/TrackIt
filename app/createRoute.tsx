import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function CreateRoute() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const [routeId, setRouteId] = useState<string | null>(null);
  const [routeName, setRouteName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverId) fetchDriverRoute();
  }, [driverId]);

  const fetchDriverRoute = async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
      Alert.alert('Error fetching route', error.message);
      return;
    }

    if (data) {
      setRouteId(data.id);
      setRouteName(data.route_name);
      setStartPoint(data.start_point);
      setEndPoint(data.end_point);
    }
  };

  const handleSaveOrUpdateRoute = async () => {
    if (!routeName.trim() || !startPoint.trim() || !endPoint.trim()) {
      return Alert.alert('Missing Info', 'Please fill all the fields.');
    }
    setLoading(true);

    let error = null;

    if (routeId) {
      // Update existing route
      ({ error } = await supabase
        .from('routes')
        .update({
          route_name: routeName.trim(),
          start_point: startPoint.trim(),
          end_point: endPoint.trim(),
        })
        .eq('id', routeId));
    } else {
      // Insert new route
      const { data, error: insertError } = await supabase
        .from('routes')
        .insert({
          driver_id: driverId,
          route_name: routeName.trim(),
          start_point: startPoint.trim(),
          end_point: endPoint.trim(),
        })
        .select()
        .single();
      error = insertError;
      if (data) setRouteId(data.id);
    }

    setLoading(false);
    if (error) return Alert.alert('Error', error.message);

    Alert.alert('Success', routeId ? 'Route updated' : 'Route created');
  };

  const handleAddStops = () => {
    if (routeId) {
      router.push({ pathname: '/addStops', params: { routeId } });
    } else {
      Alert.alert('Error', 'Please save the route first.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>{routeId ? 'Edit Route Details' : 'Create Route'}</Text>

        <TextInput
          placeholder="Route Name"
          value={routeName}
          onChangeText={setRouteName}
          style={styles.input}
        />
        <TextInput
          placeholder="Start Point"
          value={startPoint}
          onChangeText={setStartPoint}
          style={styles.input}
        />
        <TextInput
          placeholder="End Point"
          value={endPoint}
          onChangeText={setEndPoint}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleSaveOrUpdateRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : routeId ? 'Update Route' : 'Create Route'}</Text>
        </TouchableOpacity>

        {routeId && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddStops}>
            <Text style={styles.secondaryButtonText}>Add Stops</Text>
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
    fontSize: 26,
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
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
  },
});
