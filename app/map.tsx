import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, Alert, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

export default function DriverMapScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!driverId) {
        Alert.alert('Error', 'Driver ID is missing.');
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission required.');
        setLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (error: any) {
        Alert.alert('Location Error', error.message);
      }

      await fetchStopsForDriver(driverId);
      setLoading(false);
    })();
  }, [driverId]);

  const fetchStopsForDriver = async (driverId: string) => {
    try {
      const { data: routes, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('driver_id', driverId)
        .limit(1);

      if (routeError) {
        Alert.alert('Error fetching route', routeError.message);
        return;
      }

      if (!routes || routes.length === 0) {
        Alert.alert('No Route', 'No route found for this driver.');
        return;
      }

      const routeId = routes[0].id;

      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId);

      if (stopsError) {
        Alert.alert('Error fetching stops', stopsError.message);
        return;
      }

      const validStops = (stopsData || []).filter(
        (stop) => typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
      );

      setStops(validStops);
    } catch (err: any) {
      Alert.alert('Unexpected Error', err.message);
    }
  };

  if (loading || !location) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={location} title="Driver Location">
          <Image
            source={require('../assets/images/bus.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </Marker>

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.stop_name}
            description={`Stop order: ${stop.order}`}
            pinColor="#fcba03"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
