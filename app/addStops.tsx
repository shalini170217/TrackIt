import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, StyleSheet ,ImageBackground} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Feather } from '@expo/vector-icons'; // ✅ Using Feather icons (trash icon)

export default function AddStops() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const [stopName, setStopName] = useState('');
  const [order, setOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [stops, setStops] = useState<any[]>([]);

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

  const handleAddStop = async () => {
    if (!stopName.trim() || !order.trim()) {
      return Alert.alert('Missing Info', 'Please fill in both stop name and order.');
    }

    const orderNumber = parseInt(order);
    if (isNaN(orderNumber) || orderNumber <= 0) {
      return Alert.alert('Invalid Order', 'Order must be a positive number.');
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.rpc('increment_stop_orders', {
        routeid: routeId,
        neworder: orderNumber,
      });
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from('stops').insert({
        route_id: routeId,
        stop_name: stopName.trim(),
        order: orderNumber,
      });
      if (insertError) throw insertError;

      setStopName('');
      setOrder('');
      fetchStops();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          fetchStops(); // refresh list after deletion
        },
      },
    ]);
  };

  return (
    <ImageBackground source={require('../assets/images/yellowave.jpg')}
          style={styles.background}
          resizeMode="cover">
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

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleAddStop}
        disabled={loading}
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
              {item.order}. {item.stop_name}
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
        background: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stopText: {
    fontSize: 16,
  },
});
