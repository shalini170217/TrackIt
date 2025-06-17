import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Image, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';

export default function ViewBusScreen() {
  const [passengerLocation, setPassengerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1️⃣ Get current logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('User not found');

        // 2️⃣ Fetch passenger profile to get assigned driver
        const { data: passenger, error: passengerError } = await supabase
          .from('passengers')
          .select('driver_id')
          .eq('auth_id', user.id)
          .maybeSingle(); // ✅ FIXED: allows 0 or 1 rows without error

        if (passengerError) throw passengerError;
        if (!passenger) throw new Error('Passenger profile not found'); // ✅ graceful error for 0 rows

        if (!passenger.driver_id) throw new Error('No driver assigned');

        // 3️⃣ Get passenger's current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');

        const passengerLoc = await Location.getCurrentPositionAsync({});
        setPassengerLocation({
          latitude: passengerLoc.coords.latitude,
          longitude: passengerLoc.coords.longitude
        });

        // 4️⃣ Get driver's current location (from your real-time tracking system)
        const { data: driverLoc, error: driverError } = await supabase
          .from('driver_locations')
          .select('latitude, longitude')
          .eq('driver_id', passenger.driver_id)
          .maybeSingle(); // ✅ safer for 0 or 1 rows

        if (driverError) throw driverError;

        if (driverLoc) {
          setDriverLocation({
            latitude: driverLoc.latitude,
            longitude: driverLoc.longitude
          });
        }

        // 5️⃣ Get route and stops for the assigned driver
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id')
          .eq('driver_id', passenger.driver_id)
          .maybeSingle(); // ✅ safer

        if (routeError) throw routeError;
        if (!route) throw new Error('Route not found');

        const { data: stopsData, error: stopsError } = await supabase
          .from('stops')
          .select('*')
          .eq('route_id', route.id);

        if (stopsError) throw stopsError;

        const validStops = (stopsData || [])
          .filter(stop => stop.latitude && stop.longitude)
          .sort((a, b) => a.order - b.order);

        setStops(validStops);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading your bus route...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!passengerLocation) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Unable to determine your location</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: passengerLocation.latitude,
        longitude: passengerLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true}
    >
      {/* Passenger Marker */}
      <Marker coordinate={passengerLocation} title="Your Location">
        <Image
          source={require('../assets/images/pic.png')}
          style={styles.passengerIcon}
        />
      </Marker>

      {/* Driver Marker */}
      {driverLocation && (
        <Marker coordinate={driverLocation} title="Your Bus">
          <Image
            source={require('../assets/images/bus.png')}
            style={styles.busIcon}
          />
        </Marker>
      )}

      {/* Stops Markers */}
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
          title={stop.stop_name}
          description={`Stop #${stop.order}`}
          pinColor="#FFD700"
        />
      ))}

      {/* Route Polyline */}
      {stops.length > 1 && (
        <Polyline
          coordinates={stops.map(stop => ({
            latitude: stop.latitude,
            longitude: stop.longitude
          }))}
          strokeColor="#3498db"
          strokeWidth={4}
        />
      )}

      {/* Line from passenger to nearest stop */}
      {stops.length > 0 && (
        <Polyline
          coordinates={[
            passengerLocation,
            { latitude: stops[0].latitude, longitude: stops[0].longitude }
          ]}
          strokeColor="#2ecc71"
          strokeWidth={2}
          lineDashPattern={[5, 5]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerIcon: {
    width: 35,
    height: 35,
  },
  busIcon: {
    width: 40,
    height: 40,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
