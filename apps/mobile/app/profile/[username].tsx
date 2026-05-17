import { useEffect, useState } from "react";
import {
  View, Text, Image, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Link2 } from "lucide-react-native";
import { api } from "../../src/lib/api";

const RED = "#d42b2b";
const { width } = Dimensions.get("window");
const POST_SIZE = (width - 4) / 3;

interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  trustScore: number;
  createdAt: string;
  _count: { posts: number; followers: number; following: number };
  isFollowing?: boolean;
}

interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
}

const TABS = ["Postingan", "Review", "Diskusi"] as const;
type Tab = typeof TABS[number];

function getLevel(score: number) {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

function getBadges(posts: Post[], score: number) {
  const badges: { emoji: string; label: string }[] = [];
  const reviews = posts.filter(p => p.type === "review").length;
  const totalLikes = posts.reduce((s, p) => s + (p.likeCount ?? 0), 0);
  if (reviews >= 3) badges.push({ emoji: "🏆", label: "Top Reviewer" });
  if (totalLikes >= 20) badges.push({ emoji: "👍", label: "Helpful" });
  if (score >= 30) badges.push({ emoji: "🔥", label: "Trend Setter" });
  if (posts.filter(p => p.type === "photo").length >= 2) badges.push({ emoji: "📸", label: "Photographer" });
  if (posts.length >= 10) badges.push({ emoji: "✍️", label: "Contributor" });
  if (badges.length === 0) badges.push({ emoji: "⭐", label: "Rising Star" });
  return badges;
}

function formatJoin(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Postingan");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    Promise.all([
      api.get(`/users/${username}`),
      api.get(`/users/${username}/posts?limit=30`).catch(() => ({ data: [] })),
    ]).then(([pRes, postsRes]) => {
      setProfile(pRes.data);
      setFollowing(pRes.data.isFollowing ?? false);
      const pd = postsRes.data?.data ?? postsRes.data ?? [];
      setPosts(Array.isArray(pd) ? pd : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [username]);

  const toggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await api.post(`/users/${username}/follow`);
      setFollowing(f => !f);
      setProfile(p => p ? {
        ...p,
        _count: { ...p._count, followers: p._count.followers + (following ? -1 : 1) }
      } : p);
    } catch {} finally { setFollowLoading(false); }
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === "Postingan") return true;
    if (activeTab === "Review") return p.type === "review";
    if (activeTab === "Diskusi") return p.type === "discussion";
    return false;
  });

  const LoadingScreen = () => (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ width: 34 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color={RED} /></View>
    </SafeAreaView>
  );

  if (loading) return <LoadingScreen />;

  if (!profile) return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ width: 34 }} />
      </View>
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
        <Text style={{ color: "#9ca3af", fontSize: 14 }}>Profil tidak ditemukan</Text>
      </View>
    </SafeAreaView>
  );

  const level = getLevel(profile.trustScore);
  const badges = getBadges(posts, profile.trustScore);
  const poin = Math.round(profile.trustScore * 100);

  const ListHeader = () => (
    <View>
      {/* Cover */}
      <View style={styles.coverBox}>
        {profile.coverUrl ? (
          <Image source={{ uri: profile.coverUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnActive]}
          onPress={toggleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={following ? RED : "#fff"} />
          ) : (
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? "✓ Mengikuti" : "+ Ikuti"}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.avatarWrapper}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{profile.displayName[0]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Identity */}
      <View style={styles.identity}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>⭐ Level {level}</Text>
          </View>
        </View>
        <Text style={styles.usernameText}>@{profile.username}</Text>
        <Text style={styles.memberSince}>GUEPOSTING Member sejak {formatJoin(profile.createdAt)}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {profile.location ? (
          <View style={styles.metaRow}>
            <MapPin size={13} color="#9ca3af" />
            <Text style={styles.metaText}>{profile.location}</Text>
          </View>
        ) : null}
        {profile.website ? (
          <View style={styles.metaRow}>
            <Link2 size={13} color={RED} />
            <Text style={[styles.metaText, { color: RED }]}>{profile.website.replace(/^https?:\/\//, "")}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Postingan", value: formatNum(profile._count.posts) },
          { label: "Pengikut", value: formatNum(profile._count.followers) },
          { label: "Mengikuti", value: formatNum(profile._count.following) },
          { label: "Poin", value: formatNum(poin) },
        ].map((s, i) => (
          <View key={s.label} style={[styles.statBox, i > 0 && styles.statBoxBorder]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Badge</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {badges.map((b, i) => (
            <View key={i} style={styles.badgeItem}>
              <View style={styles.badgeBox}><Text style={styles.badgeEmoji}>{b.emoji}</Text></View>
              <Text style={styles.badgeLabel}>{b.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Kontribusi */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontribusi</Text>
        <View style={styles.kontribusiGrid}>
          {[
            { label: "Review", value: posts.filter(p => p.type === "review").length },
            { label: "Diskusi", value: posts.filter(p => p.type === "discussion").length },
            { label: "Foto", value: posts.filter(p => p.type === "photo").length },
            { label: "Lainnya", value: posts.filter(p => !["review","discussion","photo"].includes(p.type)).length },
          ].map(k => (
            <View key={k.label} style={styles.kontribusiBox}>
              <Text style={styles.kontribusiValue}>{k.value}</Text>
              <Text style={styles.kontribusiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredPosts.length === 0 ? (
        <View style={styles.emptyPosts}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
          <Text style={{ color: "#9ca3af", fontSize: 14 }}>Belum ada postingan</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>@{profile.username}</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={filteredPosts.length > 0 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.postCell, { width: POST_SIZE, height: POST_SIZE }]}
            onPress={() => router.push(`/post/${item.id}` as any)}
            activeOpacity={0.85}
          >
            {item.mediaUrls?.[0] ? (
              <Image source={{ uri: item.mediaUrls[0] }} style={styles.postImage} resizeMode="cover" />
            ) : (
              <View style={styles.postTextBox}>
                <Text style={styles.postText} numberOfLines={4}>{item.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: RED, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 34 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center" },

  coverBox: { height: 150, position: "relative" },
  coverImage: { width: "100%", height: 150 },
  coverPlaceholder: { width: "100%", height: 150, backgroundColor: "#c0281f" },
  avatarWrapper: { position: "absolute", bottom: -36, left: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#fff" },
  avatarFallback: { backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#fff", fontSize: 28, fontWeight: "700" },
  followBtn: {
    position: "absolute", bottom: 12, right: 16,
    backgroundColor: RED, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  followBtnActive: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: RED },
  followBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  followBtnTextActive: { color: RED },

  identity: { marginTop: 44, paddingHorizontal: 16, paddingBottom: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  displayName: { fontSize: 20, fontWeight: "800", color: "#111" },
  levelBadge: { backgroundColor: "#fef9c3", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  levelText: { fontSize: 12, fontWeight: "700", color: "#92400e" },
  usernameText: { color: "#6b7280", fontSize: 14, marginTop: 2 },
  memberSince: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  bio: { fontSize: 14, color: "#374151", marginTop: 8, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  metaText: { fontSize: 13, color: "#6b7280" },

  statsRow: {
    flexDirection: "row", backgroundColor: "#fff",
    marginHorizontal: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statBoxBorder: { borderLeftWidth: 1, borderLeftColor: "#f3f4f6" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  card: {
    backgroundColor: "#fff", marginHorizontal: 16,
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 12 },

  badgeItem: { alignItems: "center", gap: 6 },
  badgeBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#fef9c3", borderWidth: 1, borderColor: "#fde68a", justifyContent: "center", alignItems: "center" },
  badgeEmoji: { fontSize: 26 },
  badgeLabel: { fontSize: 10, color: "#6b7280", textAlign: "center", width: 56 },

  kontribusiGrid: { flexDirection: "row", gap: 8 },
  kontribusiBox: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, alignItems: "center" },
  kontribusiValue: { fontSize: 18, fontWeight: "800", color: RED },
  kontribusiLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  tabsBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: RED },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: RED },

  columnWrapper: { gap: 2, paddingHorizontal: 0 },
  postCell: { margin: 1, overflow: "hidden", backgroundColor: "#e5e7eb" },
  postImage: { width: "100%", height: "100%" },
  postTextBox: { flex: 1, padding: 6, justifyContent: "center", backgroundColor: "#f3f4f6" },
  postText: { fontSize: 10, color: "#374151", lineHeight: 14 },
  emptyPosts: { alignItems: "center", paddingTop: 40 },
});
