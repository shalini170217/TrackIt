import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
      name="index"
      options={{headerShown:false}}
      />
      <Stack.Screen 
      name="auth"
      options={{headerShown:false}}
      />
      <Stack.Screen 
      name="addStops"
      options={{headerShown:false}}
      />
      <Stack.Screen 
      name="createRoute"
      options={{headerShown:false}}
      />
      <Stack.Screen 
      name="userspage"
      options={{headerShown:false}}
      />
       <Stack.Screen 
      name="drivers"
      options={{headerShown:false}}
      />
       <Stack.Screen 
      name="map"
      options={{headerShown:false}}
      />
       <Stack.Screen 
      name="passengers"
      options={{headerShown:false}}
      />
<Stack.Screen 
      name="pass"
      options={{headerShown:false}}
      />
    </Stack>
  )
}
