import { useEffect, useState } from "react";
import {
  View, Text, TextInput, FlatList, Image,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { api } from "../../src/lib/api";
import AppHeader from "../../src/components/AppHeader";

const RED = "#d42b2b";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { members: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
}

export default function CommunityScreen() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/communities")
      .then((res) => {
        const data: Community[] = res.data?.data ?? res.data ?? [];
        setCommunities(data);
        setFiltered(data);
      })
      .catch(() => { setCommunities([]); setFiltered([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(communities);
    } else {
      const lower = text.toLowerCase();
      setFiltered(communities.filter(
        (c) => c.name.toLowerCase().includes(lower) ||
          (c.description ?? "").toLowerCase().includes(lower)
      ));
    }
  };

  const renderItem = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/community/${item.slug}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.iconBox}>
        {item.gadget?.imageUrl ? (
          <Image source={{ uri: item.gadget.imageUrl }} style={styles.gadgetImage} resizeMode="contain" />
        ) : (
          <Text style={styles.iconEmoji}>👥</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.communityName} numberOfLines={1}>{item.name}</Text>
        {item.gadget ? (
          <Text style={styles.gadgetInfo} numberOfLines={1}>
            {item.gadget.brand} {item.gadget.name}
          </Text>
        ) : item.description ? (
          <Text style={styles.communityDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.memberCount}>
          {(item._count?.members ?? 0).toLocaleString("id-ID")} anggota
        </Text>
      </View>
      <ChevronRight size={18} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader title="Komunitas" />

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Cari komunitas..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RED} />
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
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#f5f5f5" },
  searchInput: {
    backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: "#111",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, flexDirection: "row",
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
    overflow: "hidden", flexShrink: 0,
  },
  gadgetImage: { width: 50, height: 50 },
  iconEmoji: { fontSize: 28 },
  cardContent: { flex: 1 },
  communityName: { fontSize: 15, fontWeight: "700", color: "#111" },
  gadgetInfo: { fontSize: 12, color: RED, marginTop: 2, fontWeight: "600" },
  communityDesc: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  memberCount: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
});
