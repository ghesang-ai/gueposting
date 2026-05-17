import { useEffect, useState } from "react";
import {
  View, Text, Image, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
import { api } from "../../src/lib/api";
import PostCard, { Post } from "../../src/components/PostCard";

const RED = "#d42b2b";

interface CommunityDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { members: number; posts: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
  isMember?: boolean;
}

export default function CommunityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api.get(`/communities/${slug}`),
      api.get(`/communities/${slug}/posts?limit=20`).catch(() => ({ data: [] })),
    ]).then(([cRes, pRes]) => {
      setCommunity(cRes.data?.data ?? cRes.data);
      const pData = pRes.data?.data ?? pRes.data ?? [];
      setPosts(Array.isArray(pData) ? pData : []);
    }).catch(() => {
      Alert.alert("Error", "Gagal memuat komunitas.");
      router.back();
    }).finally(() => setLoading(false));
  }, [slug]);

  const toggleJoin = async () => {
    if (!community) return;
    setJoining(true);
    try {
      if (community.isMember) {
        await api.delete(`/communities/${slug}/leave`);
        setCommunity(prev => prev ? {
          ...prev, isMember: false,
          _count: { ...prev._count, members: prev._count.members - 1 }
        } : prev);
      } else {
        await api.post(`/communities/${slug}/join`);
        setCommunity(prev => prev ? {
          ...prev, isMember: true,
          _count: { ...prev._count, members: prev._count.members + 1 }
        } : prev);
      }
    } catch {
      Alert.alert("Gagal", "Tidak bisa bergabung. Coba lagi.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      </SafeAreaView>
    );
  }

  if (!community) return null;

  const ListHeader = () => (
    <View>
      {/* Cover / gadget image */}
      <View style={styles.coverBox}>
        {community.gadget?.imageUrl ? (
          <Image source={{ uri: community.gadget.imageUrl }} style={styles.coverImage} resizeMode="contain" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 64 }}>👥</Text>
          </View>
        )}
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>{community.name}</Text>
        {community.gadget && (
          <Text style={styles.gadgetTag}>
            📱 {community.gadget.brand} {community.gadget.name}
          </Text>
        )}
        {community.description ? (
          <Text style={styles.desc}>{community.description}</Text>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={14} color="#6b7280" />
            <Text style={styles.statText}>
              {(community._count.members).toLocaleString("id-ID")} anggota
            </Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.statText}>
            {(community._count.posts ?? 0).toLocaleString("id-ID")} post
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, community.isMember && styles.joinBtnActive]}
          onPress={toggleJoin}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color={community.isMember ? RED : "#fff"} />
          ) : (
            <Text style={[styles.joinBtnText, community.isMember && styles.joinBtnTextActive]}>
              {community.isMember ? "✓ Bergabung" : "+ Bergabung"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {posts.length > 0 && (
        <View style={styles.postsLabel}>
          <Text style={styles.postsLabelText}>Postingan Komunitas</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{community.name}</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📭</Text>
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>Belum ada postingan</Text>
          </View>
        }
      />
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff", flex: 1, textAlign: "center", marginHorizontal: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverBox: { backgroundColor: "#f3f4f6", height: 180, justifyContent: "center", alignItems: "center" },
  coverImage: { width: "100%", height: 180 },
  coverPlaceholder: { justifyContent: "center", alignItems: "center", height: 180 },
  infoCard: {
    backgroundColor: "#fff", margin: 16,
    borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 10, elevation: 3,
  },
  name: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 4 },
  gadgetTag: { fontSize: 13, color: RED, fontWeight: "600", marginBottom: 8 },
  desc: { fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 12 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: "#6b7280" },
  dot: { color: "#d1d5db" },
  joinBtn: {
    backgroundColor: RED, borderRadius: 14,
    paddingVertical: 12, alignItems: "center",
  },
  joinBtnActive: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: RED },
  joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  joinBtnTextActive: { color: RED },
  postsLabel: { paddingHorizontal: 16, paddingBottom: 8 },
  postsLabelText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  listContent: { paddingBottom: 32, gap: 0 },
  emptyPosts: { alignItems: "center", paddingTop: 40 },
});
