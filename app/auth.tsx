import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) {
        router.replace('/userspage');
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.replace('/userspage');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Success', 'Check your email for verification link.');
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return Alert.alert('Login Failed', error.message);
    router.replace('/userspage');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return Alert.alert('Logout Error', error.message);
    setEmail('');
    setPassword('');
  };

  return (
    <ImageBackground
      source={require('../assets/images/login2.jpg')}
      style={{ flex: 1, justifyContent: 'center', padding: 20 }}
      resizeMode="cover"
    >
      <View style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: 20, borderRadius: 10 }}>
        {session ? (
          <>
            <Text style={{ fontSize: 20, marginBottom: 20, color: 'black' }}>
              Welcome 👋 {session.user.email}
            </Text>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ backgroundColor: '#000', padding: 12, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center', color: 'black' }}>
              {isLogin ? 'Login' : 'Sign Up'}
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="black"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: 'black',
                marginBottom: 12,
                padding: 10,
                borderRadius: 6,
                color: 'black',
              }}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="black"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: 'black',
                marginBottom: 12,
                padding: 10,
                borderRadius: 6,
                color: 'black',
              }}
            />

            <TouchableOpacity
              onPress={isLogin ? handleLogin : handleSignUp}
              style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginBottom: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={{ textAlign: 'center', color: 'black' }}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ImageBackground>
  );
}
