import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../src/lib/supabase';

export default function PassengerProfileScreen() {
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    logDebug('Component mounted');
    fetchBusNumbers();
  }, []);

  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const fetchBusNumbers = async () => {
    logDebug('Fetching buses...');
    setLoading(true);
    try {
      const { data, error } = await supabase.from('drivers').select('id, bus_number').order('bus_number');
      if (error) throw error;
      setBuses(data || []);
      logDebug(`Fetched ${data?.length || 0} buses`);
    } catch (error: any) {
      logDebug(`Error fetching buses: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutesForBus = async (driverId: string) => {
    logDebug(`Fetching routes for driver ${driverId}...`);
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routes').select('id, route_name').eq('driver_id', driverId);
      if (error) throw error;
      setRoutes(data || []);
      logDebug(`Found ${data?.length || 0} routes`);
    } catch (error: any) {
      logDebug(`Error fetching routes: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStopsForRoute = async (routeId: string) => {
    logDebug(`Fetching stops for route ${routeId}...`);
    setLoading(true);
    try {
      const { data, error } = await supabase.from('stops').select('id, stop_name, order').eq('route_id', routeId).order('order', { ascending: true });
      if (error) throw error;
      setStops(data || []);
      logDebug(`Found ${data?.length || 0} stops`);
    } catch (error: any) {
      logDebug(`Error fetching stops: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !registerNumber || !selectedBusId || !selectedRouteId || !selectedStopId) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    logDebug('Submitting passenger data...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error('No authenticated user found');

      const { error } = await supabase.from('passengers').insert([{
        auth_id: user.id,
        name,
        register_number: registerNumber,
        driver_id: selectedBusId,
        route_id: selectedRouteId,
        stop_id: selectedStopId,
      }]);
      if (error) throw error;

      logDebug('Passenger created successfully');
      Alert.alert('Success', 'Passenger profile saved successfully.');

      // Reset form
      setName('');
      setRegisterNumber('');
      setSelectedBusId(null);
      setSelectedRouteId(null);
      setSelectedStopId(null);
      setRoutes([]);
      setStops([]);
    } catch (error: any) {
      logDebug(`Submission error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/yellowave.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter Name"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Text style={styles.label}>Register Number</Text>
        <TextInput
          value={registerNumber}
          onChangeText={setRegisterNumber}
          placeholder="Enter Register Number"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Text style={styles.label}>Select Bus</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedBusId}
            onValueChange={(value) => {
              setSelectedBusId(value);
              setSelectedRouteId(null);
              setSelectedStopId(null);
              setRoutes([]);
              setStops([]);
              if (value) fetchRoutesForBus(value);
            }}
            dropdownIconColor="#fff"
            style={styles.picker}
          >
            <Picker.Item label="Select Bus" value={null} color="#999" />
            {buses.map((bus) => (
              <Picker.Item key={bus.id} label={bus.bus_number || 'Unnamed Bus'} value={bus.id} color="#fff" />
            ))}
          </Picker>
        </View>

        {routes.length > 0 && (
          <>
            <Text style={styles.label}>Select Route</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedRouteId}
                onValueChange={(value) => {
                  setSelectedRouteId(value);
                  setSelectedStopId(null);
                  setStops([]);
                  if (value) fetchStopsForRoute(value);
                }}
                dropdownIconColor="#fff"
                style={styles.picker}
              >
                <Picker.Item label="Select Route" value={null} color="#999" />
                {routes.map((route) => (
                  <Picker.Item key={route.id} label={route.route_name} value={route.id} color="#fff" />
                ))}
              </Picker>
            </View>
          </>
        )}

        {stops.length > 0 && (
          <>
            <Text style={styles.label}>Select Stop</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStopId}
                onValueChange={(value) => setSelectedStopId(value)}
                dropdownIconColor="#fff"
                style={styles.picker}
              >
                <Picker.Item label="Select Stop" value={null} color="#999" />
                {stops.map((stop) => (
                  <Picker.Item key={stop.id} label={stop.stop_name} value={stop.id} color="#fff" />
                ))}
              </Picker>
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.button, loading && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
  label: {
    color: '#fff',
    marginTop: 16,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    color: '#fff',
    width: '100%',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
