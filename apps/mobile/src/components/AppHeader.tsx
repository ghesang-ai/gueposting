import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, MessageCircle } from "lucide-react-native";

const RED = "#d42b2b";

interface Props {
  showIcons?: boolean;
  title?: string;
  onBell?: () => void;
  onMessage?: () => void;
}

export default function AppHeader({ showIcons = false, title, onBell, onMessage }: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.row}>
        {title ? (
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/gueposting-icon-light.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : (
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/gueposting-icon-light.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandName}>GUEPOSTING</Text>
              <Text style={styles.brandTagline}>Gadget User Experience, Posting & Sharing</Text>
            </View>
          </View>
        )}

        {showIcons && (
          <View style={styles.icons}>
            <TouchableOpacity onPress={onBell} style={styles.iconBtn}>
              <Bell size={21} color="white" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onMessage} style={styles.iconBtn}>
              <MessageCircle size={21} color="white" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: RED },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 8 },
  brandName: { fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  brandTagline: { fontSize: 8, color: "rgba(255,255,255,0.65)", letterSpacing: 0.3 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  icons: { flexDirection: "row", gap: 14 },
  iconBtn: { padding: 2 },
});
