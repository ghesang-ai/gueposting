import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, ScrollView, ActivityIndicator,
} from "react-native";
import { TrendingUp } from "lucide-react-native";
import { api } from "../../src/lib/api";
import PostCard, { Post } from "../../src/components/PostCard";
import AppHeader from "../../src/components/AppHeader";

const RED = "#d42b2b";

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "review", label: "⭐ Review" },
  { value: "photo", label: "📷 Foto" },
  { value: "discussion", label: "💬 Diskusi" },
  { value: "video", label: "🎬 Video" },
];

export default function ExploreScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const fetchPosts = useCallback(async (p: number, q: string, type: string) => {
    try {
      let url: string;
      if (q) {
        const params = new URLSearchParams({ search: q, page: String(p), limit: "15" });
        if (type) params.set("type", type);
        url = `/posts?${params}`;
      } else if (type) {
        url = `/posts?type=${type}&page=${p}&limit=15`;
      } else {
        url = `/posts/trending?page=${p}&limit=15`;
      }
      const res = await api.get(url);
      const data: Post[] = res.data.data ?? res.data;
      if (p === 1) setPosts(data);
      else setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === 15);
    } catch {
      if (p === 1) setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setPage(1);
      setPosts([]);
      fetchPosts(1, search, filter);
    }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, filter, fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1, search, filter);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(next, search, filter);
  };

  const showTrendingLabel = !search && !filter;

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <AppHeader title="Jelajah" />
      <View style={{ backgroundColor: RED }}>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari postingan, gadget, topik..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: "#9ca3af", fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={{ marginBottom: 10 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, filter === f.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={RED} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
          ListHeaderComponent={
            showTrendingLabel ? (
              <View style={styles.trendingLabel}>
                <TrendingUp size={14} color={RED} />
                <Text style={styles.trendingLabelText}>Post Trending Minggu Ini</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                  {search ? "Tidak ada hasil untuk pencarian ini" : "Belum ada postingan"}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
                {loading ? (
                  <ActivityIndicator color={RED} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>Muat lebih banyak</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 999,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { marginRight: 6, fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: "#374151" },
  filtersContainer: { paddingHorizontal: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  chipActive: {
    backgroundColor: "white",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  chipTextActive: {
    color: RED,
  },
  trendingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  trendingLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: RED,
  },
  loadMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#6b7280",
    fontSize: 14,
  },
});
