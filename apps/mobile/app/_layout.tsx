import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "../src/stores/auth";

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="post/[id]" />
    </Stack>
  );
}
