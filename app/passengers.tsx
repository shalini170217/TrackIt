import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet ,ImageBackground} from 'react-native';
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

  // Debug state
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
      const { data, error } = await supabase
        .from('drivers')
        .select('id, bus_number')
        .order('bus_number');

      if (error) {
        logDebug(`Bus fetch error: ${error.message}`);
        throw error;
      }

      logDebug(`Fetched ${data?.length || 0} buses`);
      setBuses(data || []);
    } catch (error: any) {
      logDebug(`Error in fetchBusNumbers: ${error.message}`);
      Alert.alert('Error', `Failed to load buses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutesForBus = async (driverId: string) => {
    logDebug(`Fetching routes for driver ${driverId}...`);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name')
        .eq('driver_id', driverId);

      if (error) {
        logDebug(`Routes fetch error: ${error.message}`);
        throw error;
      }

      logDebug(`Found ${data?.length || 0} routes for driver ${driverId}`);
      setRoutes(data || []);
    } catch (error: any) {
      logDebug(`Error in fetchRoutesForBus: ${error.message}`);
      Alert.alert('Error', `Failed to load routes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStopsForRoute = async (routeId: string) => {
    logDebug(`Fetching stops for route ${routeId}...`);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stops')
        .select('id, stop_name, order')
        .eq('route_id', routeId)
        .order('order', { ascending: true });

      if (error) {
        logDebug(`Stops fetch error: ${error.message}`);
        throw error;
      }

      logDebug(`Found ${data?.length || 0} stops for route ${routeId}`);
      setStops(data || []);
    } catch (error: any) {
      logDebug(`Error in fetchStopsForRoute: ${error.message}`);
      Alert.alert('Error', `Failed to load stops: ${error.message}`);
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
      
      if (authError || !user) {
        throw authError || new Error('No authenticated user found');
      }

      logDebug(`Creating passenger for user ${user.id}`);

      const { error } = await supabase.from('passengers').insert([{
        auth_id: user.id,
        name,
        register_number: registerNumber,
        driver_id: selectedBusId,
        route_id: selectedRouteId,
        stop_id: selectedStopId,
      }]);

      if (error) {
        throw error;
      }

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
      Alert.alert('Error', `Failed to save profile: ${error.message}`);
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
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter Name"
        style={styles.input}
      />

      <Text style={styles.label}>Register Number</Text>
      <TextInput
        value={registerNumber}
        onChangeText={setRegisterNumber}
        placeholder="Enter Register Number"
        style={styles.input}
      />

      <Text style={styles.label}>Select Bus</Text>
      <Picker
        selectedValue={selectedBusId}
        onValueChange={(value) => {
          setSelectedBusId(value);
          setSelectedRouteId(null);
          setSelectedStopId(null);
          setRoutes([]);
          setStops([]);
          if (value) {
            logDebug(`Selected bus ID: ${value}`);
            fetchRoutesForBus(value);
          }
        }}
      >
        <Picker.Item label="Select Bus" value={null} />
        {buses.map((bus) => (
          <Picker.Item
            key={bus.id}
            label={bus.bus_number || 'Unnamed Bus'}
            value={bus.id}
          />
        ))}
      </Picker>

      {routes.length > 0 && (
        <>
          <Text style={styles.label}>Select Route</Text>
          <Picker
            selectedValue={selectedRouteId}
            onValueChange={(value) => {
              setSelectedRouteId(value);
              setSelectedStopId(null);
              setStops([]);
              if (value) {
                logDebug(`Selected route ID: ${value}`);
                fetchStopsForRoute(value);
              }
            }}
          >
            <Picker.Item label="Select Route" value={null} />
            {routes.map((route) => (
              <Picker.Item key={route.id} label={route.route_name} value={route.id} />
            ))}
          </Picker>
        </>
      )}

      {stops.length > 0 && (
        <>
          <Text style={styles.label}>Select Stop</Text>
          <Picker
            selectedValue={selectedStopId}
            onValueChange={(value) => {
              logDebug(`Selected stop ID: ${value}`);
              setSelectedStopId(value);
            }}
          >
            <Picker.Item label="Select Stop" value={null} />
            {stops.map((stop) => (
              <Picker.Item key={stop.id} label={stop.stop_name} value={stop.id} />
            ))}
          </Picker>
        </>
      )}

      <Button 
        title={loading ? 'Saving...' : 'Submit'} 
        onPress={handleSubmit} 
        disabled={loading} 
      />

      

    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
     background: {
    flex: 1,
  },
  container: { flex: 1, padding: 16,  },
  label: { marginTop: 16, marginBottom: 4, fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
  },
  
}); 