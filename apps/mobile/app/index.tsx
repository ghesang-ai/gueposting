import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/stores/auth";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        router.replace("/(tabs)/feed");
      } else {
        router.replace("/login");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}
