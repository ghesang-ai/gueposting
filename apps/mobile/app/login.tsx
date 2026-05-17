import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Image, StatusBar,
  ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../src/lib/api";
import { useAuthStore } from "../src/stores/auth";

const RED = "#d42b2b";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) {
      setError("Email dan password harus diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      await setAuth(res.data.user, res.data.token);
      router.replace("/(tabs)/feed");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg ?? "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          {/* Left: Logo + Headline */}
          <View style={styles.heroLeft}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headline}>
              Selamat datang{"\n"}di{" "}
              <Text style={styles.headlineRed}>GUEPOSTING</Text>
            </Text>
            <Text style={styles.subtitle}>
              Masuk untuk melanjutkan perjalanan berbagi dan menemukan hal terbaik seputar gadget.
            </Text>
          </View>

          {/* Right: Gadget Illustration */}
          <View style={styles.heroRight}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.emojiMain}>📱</Text>
              <Text style={[styles.emojiSmall, { top: 8, right: 10 }]}>⌚</Text>
              <Text style={[styles.emojiSmall, { bottom: 8, right: 4 }]}>🎧</Text>
            </View>
            {/* Floating badges */}
            <View style={[styles.badge, { top: 4, left: 10 }]}>
              <Text style={{ fontSize: 14 }}>❤️</Text>
            </View>
            <View style={[styles.badge, { bottom: 20, left: 2 }]}>
              <Text style={{ fontSize: 12 }}>🔥</Text>
            </View>
            <View style={[styles.badge, { bottom: 4, right: 20 }]}>
              <Text style={{ fontSize: 12 }}>👍</Text>
            </View>
          </View>
        </View>

        {/* ── Email Field ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 16 }}>✉️</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="kamu@email.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#bbb"
            />
          </View>
        </View>

        {/* ── Password Field ── */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Lupa password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(""); }}
              secureTextEntry={!showPassword}
              placeholderTextColor="#bbb"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Text style={{ fontSize: 18, color: "#999" }}>{showPassword ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Remember Me ── */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>✓</Text>}
          </View>
          <Text style={styles.rememberText}>Ingat saya</Text>
        </TouchableOpacity>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Submit Button ── */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={login}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Masuk</Text>
          )}
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>atau masuk dengan</Text>
          <View style={styles.divider} />
        </View>

        {/* ── Google Button ── */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => Alert.alert("Info", "Login Google belum tersedia di versi mobile.")}
          activeOpacity={0.8}
        >
          <Text style={styles.googleLetter}>G</Text>
          <Text style={styles.googleText}>Masuk dengan Google</Text>
        </TouchableOpacity>

        {/* ── Trust Badge ── */}
        <View style={styles.trustBox}>
          <View style={styles.trustIcon}>
            <Text style={{ fontSize: 20 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trustTitle}>Aman & Terpercaya</Text>
            <Text style={styles.trustDesc}>Data kamu aman bersama GUEPOSTING. Kami tidak akan membagikannya.</Text>
          </View>
        </View>

        {/* ── Register Link ── */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Belum punya akun? </Text>
          <TouchableOpacity onPress={() => router.push("/register" as any)}>
            <Text style={styles.registerLink}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },

  // Hero
  hero: { flexDirection: "row", alignItems: "flex-start", marginBottom: 28 },
  heroLeft: { flex: 1, paddingTop: 4 },
  logo: { width: 160, height: 52, marginBottom: 14, marginLeft: -4 },
  headline: { fontSize: 26, fontWeight: "800", color: "#111", lineHeight: 34 },
  headlineRed: { color: RED },
  subtitle: { fontSize: 12, color: "#888", marginTop: 8, lineHeight: 18, maxWidth: 200 },

  heroRight: { width: 150, height: 150, flexShrink: 0, position: "relative", marginRight: -8 },
  illustrationCircle: {
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: "#ffecec",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emojiMain: { fontSize: 56 },
  emojiSmall: { fontSize: 26, position: "absolute" },
  badge: {
    position: "absolute",
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 3,
  },

  // Fields
  fieldGroup: { marginBottom: 14 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  forgotText: { fontSize: 12, fontWeight: "700", color: RED },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    backgroundColor: "#fafafa",
    paddingRight: 4,
  },
  iconBox: {
    width: 44, height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#111",
    paddingRight: 12,
  },
  eyeBtn: { padding: 10 },

  // Remember me
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: RED, borderColor: RED },
  rememberText: { fontSize: 13, color: "#555" },

  // Error
  errorBox: { backgroundColor: "#fff0f0", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  errorText: { fontSize: 13, color: RED },

  // Button
  button: {
    backgroundColor: RED,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RED,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Divider
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: "#f0f0f0" },
  dividerText: { fontSize: 12, color: "#bbb", fontWeight: "500" },

  // Google
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    height: 52,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  googleLetter: { fontSize: 20, fontWeight: "900", color: "#4285F4" },
  googleText: { fontSize: 14, fontWeight: "700", color: "#333" },

  // Trust
  trustBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff8f8",
    borderWidth: 1,
    borderColor: "#fde8e8",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  trustIcon: { width: 40, height: 40, backgroundColor: "#fff", borderRadius: 12, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1 },
  trustTitle: { fontSize: 13, fontWeight: "700", color: "#222", marginBottom: 2 },
  trustDesc: { fontSize: 11, color: "#888", lineHeight: 15 },

  // Register
  registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  registerText: { fontSize: 13, color: "#888" },
  registerLink: { fontSize: 13, fontWeight: "800", color: RED },
});
