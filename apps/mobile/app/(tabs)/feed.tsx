import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Image,
  TouchableOpacity, TextInput, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, MessageCircle, Search } from "lucide-react-native";
import { api } from "../../src/lib/api";
import PostCard, { Post } from "../../src/components/PostCard";

const RED = "#d42b2b";
const HEADER_RED = "#c0281f";

const GADGETS = [
  { id: "d87dba92-e880-416a-b093-e0b6a187dcfe", name: "iPhone 17", brand: "Apple", emoji: "📱" },
  { id: "32062a42-d258-4310-bb42-760567e812a6", name: "S26 Ultra", brand: "Samsung", emoji: "📲" },
  { id: "aacabfc3-4310-4a68-ba07-6f5f2a5ccd39", name: "MacBook M5", brand: "Apple", emoji: "💻" },
  { id: "5f4cccfe-a8ee-4eaf-aff1-a29d1dd40ea1", name: "AirPods Pro 3", brand: "Apple", emoji: "🎧" },
  { id: "eb1d2c80-2358-4257-8d2f-e934103dec5f", name: "Vivo X300 Pro", brand: "Vivo", emoji: "📸" },
  { id: "1c9dfa3c-b64f-4317-94e2-57fcaad2f82d", name: "Watch Ultra 3", brand: "Apple", emoji: "⌚" },
];

export default function FeedScreen() {
  const [tab, setTab] = useState<"semua" | "following">("semua");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (p: number, currentTab: "semua" | "following") => {
    try {
      const url = currentTab === "following" ? "/posts/feed" : `/posts?page=${p}&limit=15`;
      const res = await api.get(url);
      const data: Post[] = res.data.data ?? res.data;
      if (p === 1) setPosts(data);
      else setPosts(prev => [...prev, ...data]);
      setHasMore(currentTab === "semua" ? data.length === 15 : false);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setPosts([]);
    fetchPosts(1, tab);
  }, [tab, fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1, tab);
    setRefreshing(false);
  };

  const header = (
    <>
      {/* Gadget Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 GADGET TRENDING</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Lihat semua ›</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {GADGETS.map(g => (
            <TouchableOpacity key={g.id} style={styles.gadgetItem}>
              <View style={styles.gadgetEmoji}>
                <Text style={{ fontSize: 26 }}>{g.emoji}</Text>
              </View>
              <Text style={styles.gadgetItemName} numberOfLines={1}>{g.name}</Text>
              <Text style={styles.gadgetItemBrand}>{g.brand}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Create Post */}
      <View style={styles.section}>
        <View style={styles.createRow}>
          <View style={styles.createAvatar}><Text style={styles.createAvatarText}>D</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>Apa yang baru?</Text>
            <Text style={styles.createSub}>Bagikan ke komunitas GUEPOSTING</Text>
          </View>
          <TouchableOpacity style={styles.createBtn}>
            <Text style={styles.createBtnText}>✏ Buat Post</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.createActions}>
          {[{ icon: "🖼️", label: "Foto" }, { icon: "🎬", label: "Video" }, { icon: "📊", label: "Polling" }, { icon: "#️⃣", label: "Topik" }].map(({ icon, label }) => (
            <TouchableOpacity key={label} style={styles.createAction}>
              <Text>{icon}</Text>
              <Text style={styles.createActionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Red Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: HEADER_RED }}>
        <View style={styles.headerTop}>
          <Image source={require("../../assets/logo-white.png")} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Bell size={22} color="white" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MessageCircle size={22} color="white" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchWrapper}>
          <Search size={15} color="#9ca3af" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari gadget, teman, atau topik..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["semua", "following"] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "semua" ? "Semua" : "Mengikuti"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={RED} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>Belum ada postingan</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && posts.length > 0
              ? <TouchableOpacity onPress={() => { const next = page + 1; setPage(next); fetchPosts(next, tab); }} style={{ paddingVertical: 16, alignItems: "center" }}>
                  <Text style={{ color: "#6b7280", fontSize: 14 }}>Muat lebih banyak</Text>
                </TouchableOpacity>
              : null
          }
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  logo: { height: 40, width: 140 },
  headerIcons: { flexDirection: "row", gap: 16 },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 999, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: "#374151" },
  tabs: { backgroundColor: "white", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tab: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb" },
  tabActive: { backgroundColor: RED, borderColor: RED },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "white" },
  section: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#1f2937", letterSpacing: 0.5 },
  seeAll: { fontSize: 12, fontWeight: "700", color: RED },
  gadgetItem: { alignItems: "center", width: 72 },
  gadgetEmoji: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  gadgetItemName: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", maxWidth: 68 },
  gadgetItemBrand: { fontSize: 10, color: "#9ca3af", textAlign: "center" },
  createRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  createAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  createAvatarText: { color: "white", fontWeight: "700", fontSize: 14 },
  createTitle: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  createSub: { fontSize: 12, color: "#9ca3af" },
  createBtn: { backgroundColor: "#fef2f2", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#fecaca" },
  createBtnText: { color: RED, fontSize: 13, fontWeight: "700" },
  createActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  createAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  createActionText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
});
