import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../src/lib/api";
import { useAuthStore } from "../src/stores/auth";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      await setAuth(res.data.user, res.data.token);
      router.replace("/(tabs)/feed");
    } catch {
      Alert.alert("Login Gagal", "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>GUEPOSTING</Text>
        <Text style={styles.subtitle}>Masuk ke akunmu</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Masuk..." : "Masuk"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  logo: { fontSize: 32, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#000" },
  button: { backgroundColor: "#000", borderRadius: 12, paddingVertical: 16, marginTop: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 15 },
});
