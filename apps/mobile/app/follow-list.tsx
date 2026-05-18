import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../src/lib/api";

const RED = "#d42b2b";

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  trustScore: number;
  isFollowing: boolean;
  followsYou: boolean;
}

type Tab = "followers" | "following";

export default function FollowListScreen() {
  const { username, tab: initialTab } = useLocalSearchParams<{ username: string; tab: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? "followers");
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [fersRes, fingRes] = await Promise.all([
        api.get(`/users/${username}/followers`),
        api.get(`/users/${username}/following`),
      ]);
      const fersData: FollowUser[] = fersRes.data ?? [];
      const fingData: FollowUser[] = fingRes.data ?? [];
      setFollowers(fersData);
      setFollowing(fingData);
      const map: Record<string, boolean> = {};
      [...fersData, ...fingData].forEach(u => { map[u.id] = u.isFollowing; });
      setFollowingMap(map);
    } catch {}
    finally { setLoading(false); }
  }, [username]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFollow = async (u: FollowUser) => {
    try {
      await api.post(`/users/${u.username}/follow`);
      setFollowingMap(prev => ({ ...prev, [u.id]: !prev[u.id] }));
    } catch {}
  };

  const list = tab === "followers" ? followers : following;

  const renderItem = ({ item: u }: { item: FollowUser }) => (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => router.push(`/profile/${u.username}` as any)} style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {u.avatarUrl
            ? <Image source={{ uri: u.avatarUrl }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{u.displayName[0]}</Text>}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.info}
        onPress={() => router.push(`/profile/${u.username}` as any)}
      >
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>{u.displayName}</Text>
          {u.trustScore >= 50 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTick}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.subRow}>
          <Text style={styles.username}>@{u.username}</Text>
          {u.followsYou && (
            <View style={styles.followsYouChip}>
              <Text style={styles.followsYouText}>Mengikutimu</Text>
            </View>
          )}
        </View>
        {u.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{u.bio}</Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.followBtn, followingMap[u.id] && styles.followBtnActive]}
        onPress={() => toggleFollow(u)}
      >
        <Text style={[styles.followBtnText, followingMap[u.id] && styles.followBtnTextActive]}>
          {followingMap[u.id] ? "Mengikuti" : "Ikuti"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>@{username}</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["followers", "following"] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={styles.tabBtn}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "followers" ? "Pengikut" : "Mengikuti"}
            </Text>
            {tab === t && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={RED} size="large" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={u => u.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {tab === "followers" ? "Belum ada pengikut" : "Belum mengikuti siapapun"}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    backgroundColor: RED, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 34 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },

  tabs: { backgroundColor: "#fff", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center", position: "relative" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#111827" },
  tabIndicator: {
    position: "absolute", bottom: 0, left: "25%" as any, right: "25%" as any,
    height: 3, backgroundColor: RED, borderRadius: 2,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyText: { color: "#9ca3af", fontSize: 14 },

  row: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff", gap: 12,
  },
  separator: { height: 1, backgroundColor: "#f9fafb" },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: RED, overflow: "hidden",
    justifyContent: "center", alignItems: "center",
  },
  avatarImg: { width: 44, height: 44 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  displayName: { fontSize: 14, fontWeight: "700", color: "#111827", flexShrink: 1 },
  badge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#1d9bf0", justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  badgeTick: { color: "#fff", fontSize: 9, fontWeight: "700" },
  subRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  username: { fontSize: 12, color: "#9ca3af" },
  followsYouChip: {
    backgroundColor: "#f3f4f6", borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  followsYouText: { fontSize: 10, color: "#6b7280", fontWeight: "600" },
  bio: { fontSize: 13, color: "#374151", marginTop: 4, lineHeight: 18 },

  followBtn: {
    flexShrink: 0, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#111827",
    backgroundColor: "#111827",
  },
  followBtnActive: { backgroundColor: "#fff", borderColor: "#d1d5db" },
  followBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  followBtnTextActive: { color: "#374151" },
});
