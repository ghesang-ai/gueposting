import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useAuthStore } from "../../src/stores/auth";
import { api } from "../../src/lib/api";
import AppHeader from "../../src/components/AppHeader";

const { width } = Dimensions.get("window");
const POST_SIZE = (width - 48) / 2;

interface FullProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  bio: string | null;
  trustScore: number;
  role: string;
  createdAt: string;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  points?: number;
}

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data?.data ?? res.data);
    } catch {
      // fallback to store data
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!user?.username) {
      setLoadingPosts(false);
      return;
    }
    try {
      const res = await api.get(`/users/${user.username}/posts?limit=20`);
      setPosts(res.data?.data ?? res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const handleLogout = () => {
    Alert.alert("Keluar?", "", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const displayName = profile?.displayName ?? user?.displayName ?? "";
  const username = profile?.username ?? user?.username ?? "";
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl ?? null;
  const coverUrl = profile?.coverUrl ?? null;
  const location = profile?.location ?? null;
  const createdAt = profile?.createdAt ?? null;
  const postCount = profile?.postCount ?? 0;
  const followerCount = profile?.followerCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;
  const points = profile?.points ?? user?.trustScore ?? 0;
  const level = Math.max(1, Math.floor((user?.trustScore ?? 0) / 100) + 1);

  const renderPost = ({ item }: { item: Post }) => {
    const imageUrl = item.mediaUrls?.[0] ?? null;
    return (
      <View style={[styles.postCell, { width: POST_SIZE, height: POST_SIZE }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.postImage} resizeMode="cover" />
        ) : (
          <View style={styles.postTextBox}>
            <Text style={styles.postText} numberOfLines={4}>{item.content}</Text>
          </View>
        )}
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Cover image */}
      <View style={styles.coverContainer}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        {/* Gear icon top-right */}
        <TouchableOpacity style={styles.gearButton} onPress={handleLogout} hitSlop={8}>
          <Settings size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>

        {/* Avatar overlapping cover */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{displayName[0] ?? "?"}</Text>
            </View>
          )}
        </View>

        {/* Edit Profil button */}
        <TouchableOpacity style={styles.editButton} onPress={() => router.push("/profile/edit")}>
          <Text style={styles.editButtonText}>Edit Profil</Text>
        </TouchableOpacity>
      </View>

      {/* Profile info */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>⭐ Level {level}</Text>
          </View>
        </View>
        <Text style={styles.usernameText}>@{username}</Text>

        {createdAt ? (
          <Text style={styles.memberSince}>GUEPOSTING Member sejak {formatMemberSince(createdAt)}</Text>
        ) : null}

        {location ? (
          <Text style={styles.locationText}>📍 {location}</Text>
        ) : null}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: "Postingan", value: postCount, tab: null },
          { label: "Pengikut", value: followerCount, tab: "followers" },
          { label: "Mengikuti", value: followingCount, tab: "following" },
          { label: "Poin", value: points, tab: null },
        ].map((stat) => (
          <TouchableOpacity
            key={stat.label}
            style={styles.statBox}
            onPress={stat.tab ? () => router.push(`/follow-list?username=${username}&tab=${stat.tab}` as any) : undefined}
            disabled={!stat.tab}
          >
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={[styles.statLabel, stat.tab ? { color: "#374151" } : null]}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Badge section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Badge</Text>
        {(() => {
          const score = profile?.trustScore ?? user?.trustScore ?? 0;
          const badges = [];
          if (postCount >= 1) badges.push({ emoji: "✍️", name: "Kontributor Pertama", desc: "Sudah membuat postingan pertama" });
          if (postCount >= 10) badges.push({ emoji: "🔥", name: "Aktif Posting", desc: "Sudah membuat 10+ postingan" });
          if (score >= 5) badges.push({ emoji: "⭐", name: "Rising Star", desc: "Aktif berkontribusi di komunitas" });
          if (score >= 8) badges.push({ emoji: "💎", name: "Trusted Member", desc: "Trust score tinggi di komunitas" });
          if (badges.length === 0) badges.push({ emoji: "🌱", name: "Member Baru", desc: "Selamat datang di GUEPOSTING!" });
          return badges.map((b) => (
            <View key={b.name} style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
              <View>
                <Text style={styles.badgeName}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </View>
            </View>
          ));
        })()}
      </View>

      {/* Kontribusi section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontribusi</Text>
        <View style={styles.kontribusiGrid}>
          {[
            { label: "Review", value: posts.filter(p => (p as any).type === "review").length },
            { label: "Diskusi", value: posts.filter(p => (p as any).type === "discussion").length },
            { label: "Foto", value: posts.filter(p => (p as any).type === "photo").length },
            { label: "Lainnya", value: posts.filter(p => !["review","discussion","photo"].includes((p as any).type ?? "")).length },
          ].map((k) => (
            <View key={k.label} style={styles.kontribusiBox}>
              <Text style={styles.kontribusiValue}>{k.value}</Text>
              <Text style={styles.kontribusiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Posts section header */}
      <View style={styles.postsHeader}>
        <Text style={styles.postsHeaderText}>Postingan</Text>
      </View>

      {loadingPosts ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#d42b2b" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyPostsText}>Belum ada postingan</Text>
        </View>
      ) : null}
    </View>
  );

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={[]}>
        <AppHeader title="Profil" />
        <ActivityIndicator size="large" color="#d42b2b" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader title="Profil" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={posts.length > 0 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  flatListContent: { paddingBottom: 32 },

  // Cover
  coverContainer: { position: "relative", height: 160 },
  coverImage: { width: "100%", height: 160 },
  coverPlaceholder: { width: "100%", height: 160, backgroundColor: "#d1d5db" },
  gearButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    padding: 6,
  },
  avatarWrapper: {
    position: "absolute",
    bottom: -40,
    left: 16,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#fff" },
  avatarFallback: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 32, fontWeight: "700", color: "#374151" },
  editButton: {
    position: "absolute",
    bottom: -36,
    right: 16,
    borderWidth: 1.5,
    borderColor: "#d42b2b",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  editButtonText: { color: "#d42b2b", fontWeight: "600", fontSize: 13 },

  // Info
  infoSection: { marginTop: 48, paddingHorizontal: 16, paddingBottom: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  displayName: { fontSize: 20, fontWeight: "800", color: "#111" },
  levelBadge: { backgroundColor: "#fef9c3", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  levelText: { fontSize: 12, fontWeight: "700", color: "#92400e" },
  usernameText: { color: "#6b7280", marginTop: 2, fontSize: 14 },
  memberSince: { color: "#9ca3af", fontSize: 12, marginTop: 6 },
  locationText: { color: "#6b7280", fontSize: 13, marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 12 },

  // Badge
  badgeItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgeEmoji: { fontSize: 32 },
  badgeName: { fontSize: 14, fontWeight: "700", color: "#111" },
  badgeDesc: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  // Kontribusi
  kontribusiGrid: { flexDirection: "row", gap: 8 },
  kontribusiBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  kontribusiValue: { fontSize: 18, fontWeight: "800", color: "#d42b2b" },
  kontribusiLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  // Posts
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#d42b2b",
    marginBottom: 4,
  },
  postsHeaderText: { fontSize: 14, fontWeight: "700", color: "#d42b2b" },
  columnWrapper: { gap: 8, paddingHorizontal: 16 },
  postCell: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#e5e7eb",
  },
  postImage: { width: "100%", height: "100%" },
  postTextBox: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  postText: { fontSize: 12, color: "#374151", lineHeight: 17 },

  // Empty
  center: { padding: 24, alignItems: "center" },
  emptyPosts: { padding: 32, alignItems: "center" },
  emptyPostsText: { color: "#9ca3af", fontSize: 14 },
});
