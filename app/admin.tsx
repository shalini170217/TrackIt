import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';

export default function AdminPage() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    let interval: any;
    if (selectedDriverId) {
      fetchDriverLocation(); // initial fetch
      interval = setInterval(fetchDriverLocation, 5000); // auto-refresh every 5 sec
    }
    return () => clearInterval(interval);
  }, [selectedDriverId]);

  const fetchDrivers = async () => {
    const { data, error } = await supabase.from('drivers').select('id, bus_number');
    if (error) {
      console.error(error.message);
      Alert.alert('Error', error.message);
      return;
    }
    setDrivers(data || []);
  };

  const fetchDriverLocation = async () => {
    if (!selectedDriverId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('driver_locations')
      .select('latitude, longitude')
      .eq('driver_id', selectedDriverId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setDriverLocation({ latitude: data.latitude, longitude: data.longitude });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Panel</Text>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Bus:</Text>
        <Picker
          selectedValue={selectedDriverId}
          onValueChange={(itemValue) => setSelectedDriverId(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="-- Choose Bus --" value={null} />
          {drivers.map((driver) => (
            <Picker.Item key={driver.id} label={driver.bus_number} value={driver.id} />
          ))}
        </Picker>
      </View>

      {loading && <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />}

      {driverLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Driver Location"
            description="Current location of the bus"
          />
        </MapView>
      )}

      {!driverLocation && selectedDriverId && !loading && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#555' }}>
          No location available for this driver.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#000',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    flex: 1,
  },
});
