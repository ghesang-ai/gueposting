import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ScrollView, ActivityIndicator, Image,
} from "react-native";
import { Search } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/stores/auth";
import { api } from "../../src/lib/api";
import PostCard, { Post } from "../../src/components/PostCard";
import AppHeader from "../../src/components/AppHeader";

const RED = "#d42b2b";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  imageUrl: string | null;
}

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"semua" | "following">("semua");
  const [posts, setPosts] = useState<Post[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
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

  const fetchGadgets = useCallback(async () => {
    try {
      const res = await api.get("/gadgets/trending");
      setGadgets(res.data ?? []);
    } catch {
      try {
        const res = await api.get("/gadgets?limit=6");
        const data = res.data?.data ?? res.data ?? [];
        setGadgets(data.slice(0, 6));
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchGadgets();
  }, [fetchGadgets]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setPosts([]);
    fetchPosts(1, tab);
  }, [tab, fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([fetchPosts(1, tab), fetchGadgets()]);
    setRefreshing(false);
  };

  const displayName = user?.displayName ?? "U";
  const avatarUrl = user?.avatarUrl ?? null;
  const initial = displayName[0]?.toUpperCase() ?? "U";

  const header = (
    <>
      {/* Gadget Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 GADGET TRENDING</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Lihat semua ›</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {gadgets.map(g => (
            <TouchableOpacity key={g.id} style={styles.gadgetItem}>
              <View style={styles.gadgetImageBox}>
                {g.imageUrl ? (
                  <Image source={{ uri: g.imageUrl }} style={styles.gadgetImage} resizeMode="contain" />
                ) : (
                  <Text style={{ fontSize: 26 }}>📱</Text>
                )}
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
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.createAvatarImg} />
          ) : (
            <View style={styles.createAvatar}>
              <Text style={styles.createAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>Apa yang baru?</Text>
            <Text style={styles.createSub}>Bagikan ke komunitas GUEPOSTING</Text>
          </View>
          <TouchableOpacity style={styles.createBtn}>
            <Text style={styles.createBtnText}>✏️ Buat Post</Text>
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
      {/* Header */}
      <AppHeader showIcons />
      <View style={{ backgroundColor: RED, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity style={styles.searchWrapper} onPress={() => router.push("/search")} activeOpacity={0.8}>
          <Search size={15} color="#9ca3af" style={{ marginRight: 6 }} />
          <Text style={styles.searchPlaceholder}>Cari gadget, teman, atau topik...</Text>
        </TouchableOpacity>
      </View>

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
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 999, paddingHorizontal: 12, height: 40 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#9ca3af" },
  tabs: { backgroundColor: "white", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tab: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb" },
  tabActive: { backgroundColor: RED, borderColor: RED },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "white" },
  section: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#1f2937", letterSpacing: 0.5 },
  seeAll: { fontSize: 12, fontWeight: "700", color: RED },
  gadgetItem: { alignItems: "center", width: 76 },
  gadgetImageBox: { width: 68, height: 68, borderRadius: 16, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", justifyContent: "center", alignItems: "center", marginBottom: 6, overflow: "hidden" },
  gadgetImage: { width: 60, height: 60 },
  gadgetItemName: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", maxWidth: 72 },
  gadgetItemBrand: { fontSize: 10, color: "#9ca3af", textAlign: "center" },
  createRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  createAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  createAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  createAvatarText: { color: "white", fontWeight: "700", fontSize: 14 },
  createTitle: { fontSize: 14, fontWeight: "600", color: "#1f2937" },
  createSub: { fontSize: 12, color: "#9ca3af" },
  createBtn: { backgroundColor: "#fef2f2", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#fecaca" },
  createBtnText: { color: RED, fontSize: 13, fontWeight: "700" },
  createActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  createAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  createActionText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
});
