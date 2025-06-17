import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function PassScreen() {
  const router = useRouter();

  const [driverId, setDriverId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPassengerAndMessages();
  }, []);

  const fetchPassengerAndMessages = async () => {
    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch passenger profile
    const { data: passenger, error: passengerError } = await supabase
      .from('passengers')
      .select('driver_id')
      .eq('auth_id', user.id)
      .single();

    if (passengerError || !passenger) {
      console.error(passengerError?.message);
      setLoading(false);
      return;
    }

    setDriverId(passenger.driver_id);

    // Fetch messages for the passenger's driver_id
    const { data: driverMessages, error: messageError } = await supabase
      .from('driver_messages')
      .select('*')
      .eq('driver_id', passenger.driver_id)
      .order('created_at', { ascending: false });

    if (messageError) {
      console.error(messageError.message);
    } else {
      setMessages(driverMessages || []);
    }

    setLoading(false);
  };

  return (
    <ImageBackground
      source={require('../assets/images/login2.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* View My Bus button at top-left */}
      <TouchableOpacity style={styles.busButton} onPress={() => router.push('/view-bus')}>
        <Text style={styles.busButtonText}>View My Bus</Text>
      </TouchableOpacity>

      {/* My Profile button at top-right */}
      <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/passengers')}>
        <Text style={styles.profileButtonText}>My Profile</Text>
      </TouchableOpacity>

      {/* Messages */}
      <View style={styles.messageContainer}>
        <Text style={styles.heading}>Driver Messages</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : messages.length === 0 ? (
          <Text style={styles.noMessageText}>No messages yet</Text>
        ) : (
          <ScrollView style={{ maxHeight: '70%' }}>
            {messages.map((msg) => (
              <View key={msg.id} style={styles.messageCard}>
                <Text style={styles.messageText}>{msg.message}</Text>
                <Text style={styles.messageTime}>{new Date(msg.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  busButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#00000080',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 10,
  },
  busButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#00000080',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    zIndex: 10,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
    marginTop: 120,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  noMessageText: {
    color: '#444',
    fontSize: 16,
  },
  messageCard: {
    backgroundColor: '#fff8dc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
    textAlign: 'right',
  },
});
