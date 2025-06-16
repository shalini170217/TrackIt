import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  
  // Example stops — you can fetch these from Supabase or define statically
  const stops = [
    { id: 1, name: 'Stop 1', latitude: 37.78825, longitude: -122.4324 },
    { id: 2, name: 'Stop 2', latitude: 37.78925, longitude: -122.4354 },
    { id: 3, name: 'Stop 3', latitude: 37.79025, longitude: -122.4374 },
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          showsUserLocation={false} // Disable default blue dot (we’ll use our custom bus marker)
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* ✅ DRIVER’S LOCATION WITH BUS ICON */}
          <Marker coordinate={location} title="Driver Location">
            <Image
              source={require('../assets/images/bus.png')} // 👈 Add your bus icon in /assets/bus.png
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </Marker>

          {/* ✅ STOPS WITH 📍 */}
          {stops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
            />
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
