import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { api } from "../src/lib/api";
import PostCard, { Post } from "../src/components/PostCard";

const RED = "#d42b2b";
const HEADER_RED = "#c0281f";

const TABS = [
  { value: "posts", label: "Post" },
  { value: "users", label: "Orang" },
  { value: "gadgets", label: "Gadget" },
] as const;
type Tab = typeof TABS[number]["value"];

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟",
  wearable: "⌚", audio: "🎧", other: "🔌",
};

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  trustScore: number;
}

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  avgScore: number;
  reviewCount: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPosts([]); setUsers([]); setGadgets([]);
      return;
    }
    setLoading(true);
    try {
      const [postsRes, usersRes, gadgetsRes] = await Promise.all([
        api.get(`/posts?search=${encodeURIComponent(q)}&limit=15`).catch(() => ({ data: [] })),
        api.get(`/users?search=${encodeURIComponent(q)}&limit=10`).catch(() => ({ data: [] })),
        api.get(`/gadgets?search=${encodeURIComponent(q)}&limit=10`).catch(() => ({ data: [] })),
      ]);
      setPosts(postsRes.data.data ?? postsRes.data ?? []);
      setUsers(usersRes.data.data ?? usersRes.data ?? []);
      setGadgets(gadgetsRes.data.data ?? gadgetsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const currentCount = tab === "posts" ? posts.length : tab === "users" ? users.length : gadgets.length;

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} activeOpacity={0.8} onPress={() => router.push(`/profile/${item.username}` as any)}>
      <View style={styles.userAvatar}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatarImg} />
        ) : (
          <View style={[styles.userAvatarImg, styles.userAvatarFallback]}>
            <Text style={styles.userAvatarLetter}>{item.displayName[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userDisplayName}>{item.displayName}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.bio ? <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
      <TouchableOpacity style={styles.followBtn}>
        <Text style={styles.followBtnText}>Ikuti</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGadget = ({ item }: { item: Gadget }) => (
    <TouchableOpacity style={styles.gadgetCard} activeOpacity={0.8}>
      <View style={styles.gadgetImageBox}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.gadgetImage} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: 32 }}>{CATEGORY_EMOJI[item.category] ?? "📱"}</Text>
        )}
      </View>
      <View style={styles.gadgetInfo}>
        <Text style={styles.gadgetName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.gadgetBrand}>{item.brand}</Text>
        {item.reviewCount > 0 ? (
          <Text style={styles.gadgetScore}>⭐ {item.avgScore.toFixed(1)} · {item.reviewCount} review</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const isEmpty = !loading && query.trim() && currentCount === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={15} color="#9ca3af" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Cari post, orang, atau gadget..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((t) => {
          const count = t.value === "posts" ? posts.length : t.value === "users" ? users.length : gadgets.length;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tabBtn, tab === t.value && styles.tabBtnActive]}
              onPress={() => setTab(t.value)}
            >
              <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>
                {t.label}
                {query.trim() && count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      ) : !query.trim() ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={styles.hintText}>Cari post, orang, atau gadget</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={styles.hintText}>Tidak ada hasil untuk "{query}"</Text>
        </View>
      ) : tab === "posts" ? (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : tab === "users" ? (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={gadgets}
          keyExtractor={(g) => g.id}
          renderItem={renderGadget}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  // Header
  header: {
    backgroundColor: HEADER_RED,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: { padding: 2 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111", padding: 0 },

  // Tabs
  tabsBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: RED },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: RED },

  // States
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hintText: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32 },
  listContent: { padding: 12, gap: 10 },

  // User card
  userCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, flexDirection: "row",
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 1,
  },
  userAvatar: { flexShrink: 0 },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  userAvatarFallback: { backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  userAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 18 },
  userInfo: { flex: 1 },
  userDisplayName: { fontSize: 15, fontWeight: "700", color: "#111" },
  userUsername: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  userBio: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
  followBtn: {
    borderWidth: 1.5, borderColor: RED,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  followBtnText: { color: RED, fontSize: 13, fontWeight: "700" },

  // Gadget card
  gadgetCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, flexDirection: "row",
    alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 1,
  },
  gadgetImageBox: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  gadgetImage: { width: 54, height: 54 },
  gadgetInfo: { flex: 1 },
  gadgetName: { fontSize: 15, fontWeight: "700", color: "#111" },
  gadgetBrand: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  gadgetScore: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
});
