import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";
import { api } from "../../src/lib/api";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { members: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
}

export default function CommunityScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/communities")
      .then((res) => {
        const data: Community[] = res.data?.data ?? res.data ?? [];
        setCommunities(data);
        setFiltered(data);
      })
      .catch(() => {
        setCommunities([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(communities);
    } else {
      const lower = text.toLowerCase();
      setFiltered(
        communities.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            (c.description ?? "").toLowerCase().includes(lower)
        )
      );
    }
  };

  const handlePress = (c: Community) => {
    Alert.alert(c.name);
  };

  const renderItem = ({ item }: { item: Community }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.85}>
      <View style={styles.iconBox}>
        {item.gadget?.imageUrl ? (
          <Image source={{ uri: item.gadget.imageUrl }} style={styles.gadgetImage} resizeMode="cover" />
        ) : (
          <Text style={styles.iconEmoji}>👥</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.communityName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.communityDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text style={styles.memberCount}>{item._count?.members ?? 0} anggota</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Users size={22} color="#fff" strokeWidth={2.2} />
        <Text style={styles.headerTitle}>Komunitas</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari komunitas..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#c0281f" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>Belum ada komunitas</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#c0281f",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gadgetImage: { width: 56, height: 56 },
  iconEmoji: { fontSize: 28 },
  cardContent: { flex: 1 },
  communityName: { fontSize: 15, fontWeight: "700", color: "#111" },
  communityDesc: { fontSize: 13, color: "#6b7280", marginTop: 2, lineHeight: 18 },
  memberCount: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
});
