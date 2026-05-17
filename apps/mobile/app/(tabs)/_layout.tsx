import { Tabs } from "expo-router";
import { Home, Compass, PlusCircle, Users, User } from "lucide-react-native";
import { View } from "react-native";

const RED = "#d42b2b";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopColor: "#f3f4f6",
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
      },
      tabBarActiveTintColor: RED,
      tabBarInactiveTintColor: "#9ca3af",
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
    }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Jelajah",
          tabBarIcon: ({ color, focused }) => <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={{
              width: 50, height: 50, borderRadius: 25,
              backgroundColor: RED,
              justifyContent: "center", alignItems: "center",
              marginBottom: 20,
              shadowColor: RED, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
            }}>
              <PlusCircle size={26} color="white" strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Komunitas",
          tabBarIcon: ({ color, focused }) => <Users size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />,
        }}
      />
      {/* Hidden from tab bar — still accessible as a route */}
      <Tabs.Screen
        name="compare"
        options={{ href: null }}
      />
    </Tabs>
  );
}
