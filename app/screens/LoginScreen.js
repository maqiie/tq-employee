import React, { useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/api";
import { storeUserData } from "../services/auth";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuthUser } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      // Step 1: Login and get tokens from headers + user data
      const { accessToken, client, uid, user } = await login(email, password);

      if (!accessToken || !client || !uid) {
        throw new Error("Missing authentication headers");
      }

      // Step 2: Validate token with backend to get fresh user data
      const validateResponse = await axios.get(
        "http://192.168.100.5:3001/auth/validate_token",
        {
          headers: {
            "access-token": accessToken,
            client,
            uid,
          },
        }
      );

      const validatedUser = validateResponse.data.data;
      if (!validatedUser) {
        throw new Error("Failed to retrieve user from token validation");
      }

      // Step 3: Store tokens and user data in AsyncStorage
      await storeUserData({
        user: validatedUser,
        accessToken,
        client,
        uid,
      });

      // Step 4: Update auth context and navigate
      await setAuthUser({
        user: validatedUser,
        accessToken,
        client,
        uid,
      });
      
      navigation.navigate("Dashboard");
    } catch (error) {
      console.error("Login or validation failed:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Unexpected error occurred."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} color="#6B46C1" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f8f8ff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#4B0082",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
});

export default LoginScreen;
