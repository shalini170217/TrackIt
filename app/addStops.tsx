import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Feather } from '@expo/vector-icons';

export default function AddStops() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const [stopName, setStopName] = useState('');
  const [order, setOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [stops, setStops] = useState<any[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (routeId) fetchStops();
  }, [routeId]);

  const fetchStops = async () => {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('route_id', routeId)
      .order('order', { ascending: true });

    if (error) {
      console.error(error);
      Alert.alert('Error fetching stops', error.message);
      return;
    }
    setStops(data || []);
  };

  const getLatLongFromPlace = async (place: string) => {
    try {
      setGettingLocation(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'TrackNowApp/1.0 (your-email@example.com)', // ⚠️ Replace with your app/email
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Location API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGettingLocation(false);

      if (data.length === 0) {
        throw new Error('Location not found. Try entering a more specific name.');
      }

      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    } catch (error) {
      setGettingLocation(false);
      throw error;
    }
  };

  const handleAddStop = async () => {
    if (!stopName.trim() || !order.trim()) {
      return Alert.alert('Missing Info', 'Please fill in both stop name and order.');
    }

    const orderNumber = parseInt(order);
    if (isNaN(orderNumber) || orderNumber <= 0) {
      return Alert.alert('Invalid Order', 'Order must be a positive number.');
    }

    try {
      const { lat, lon } = await getLatLongFromPlace(stopName);

      setLoading(true);

      const { error: updateError } = await supabase.rpc('increment_stop_orders', {
        routeid: routeId,
        neworder: orderNumber,
      });
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from('stops').insert({
        route_id: routeId,
        stop_name: stopName.trim(),
        order: orderNumber,
        latitude: lat,
        longitude: lon,
      });
      if (insertError) throw insertError;

      setStopName('');
      setOrder('');
      fetchStops();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (stopId: string) => {
    Alert.alert('Delete Stop', 'Are you sure you want to delete this stop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('stops').delete().eq('id', stopId);
          if (error) {
            Alert.alert('Error deleting stop', error.message);
            return;
          }
          fetchStops();
        },
      },
    ]);
  };

  return (
    <ImageBackground source={require('../assets/images/yellowave.jpg')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Add Stops to Route</Text>

        <TextInput
          placeholder="Stop Name"
          value={stopName}
          onChangeText={setStopName}
          style={styles.input}
        />
        <TextInput
          placeholder="Order (Number)"
          value={order}
          onChangeText={setOrder}
          keyboardType="numeric"
          style={styles.input}
        />

        {gettingLocation && <ActivityIndicator size="small" color="#000" />}

        <TouchableOpacity
          style={[styles.button, (loading || gettingLocation) && styles.disabledButton]}
          onPress={handleAddStop}
          disabled={loading || gettingLocation}
        >
          <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add Stop'}</Text>
        </TouchableOpacity>

        <Text style={styles.subheading}>Stops List</Text>

        <FlatList
          data={stops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.stopItem}>
              <Text style={styles.stopText}>
                {item.order}. {item.stop_name} ({item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)})
              </Text>
              <TouchableOpacity onPress={() => handleDeleteStop(item.id)}>
                <Feather name="trash-2" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999' }}>No stops yet.</Text>}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  subheading: { fontSize: 20, fontWeight: 'bold', marginTop: 25, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stopText: { fontSize: 16, color: '#222' },
});
