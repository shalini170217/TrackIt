import { View, Text, ImageBackground, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../assets/images/main.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.textcontainer}>
          <Text style={styles.text}>TRACK NOW</Text>

          <TouchableOpacity style={styles.button} onPress={() => router.push("/auth")}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textcontainer: {
    alignItems: "center",
  },
  text: {
    color: "black",
    fontSize: 36,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "black",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
