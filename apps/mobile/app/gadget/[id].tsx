import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Star, GitCompare, ShoppingBag } from "lucide-react-native";
import { api } from "../../src/lib/api";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  specs: Record<string, string>;
  avgScore: number;
  reviewCount: number;
  imageUrl: string | null;
}

interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  likeCount: number;
  createdAt: string;
  user: { username: string; displayName: string };
}

export default function GadgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [gadget, setGadget] = useState<Gadget | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          api.get(`/gadgets/${id}`),
          api.get(`/posts?gadgetId=${id}&limit=10`),
        ]);
        setGadget(gRes.data);
        setPosts(pRes.data.data ?? pRes.data);
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const searchErafone = () => {
    if (!gadget) return;
    const q = encodeURIComponent(`${gadget.brand} ${gadget.name}`);
    Linking.openURL(`https://www.erafone.com/search?q=${q}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color="#111" />
      </SafeAreaView>
    );
  }

  if (!gadget) return null;

  const specEntries = Object.entries(gadget.specs ?? {});

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {gadget.brand} {gadget.name}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroBox}>
          {gadget.imageUrl ? (
            <Image source={{ uri: gadget.imageUrl }} style={styles.heroImg} resizeMode="contain" />
          ) : (
            <Text style={styles.emoji}>📱</Text>
          )}
        </View>

        <View style={styles.body}>
          {/* Info */}
          <Text style={styles.brand}>{gadget.brand}</Text>
          <Text style={styles.name}>{gadget.name}</Text>
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{gadget.category}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{gadget.avgScore.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>{gadget.reviewCount} ulasan</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={() => router.push("/(tabs)/compare" as any)}
            >
              <GitCompare size={15} color="#111" />
              <Text style={styles.compareBtnText}>Bandingkan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyBtn} onPress={searchErafone}>
              <ShoppingBag size={15} color="#fff" />
              <Text style={styles.buyBtnText}>Cari di Erafone</Text>
            </TouchableOpacity>
          </View>

          {/* Specs */}
          {specEntries.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spesifikasi</Text>
              <View style={styles.specsBox}>
                {specEntries.map(([key, val]) => (
                  <View key={key} style={styles.specRow}>
                    <Text style={styles.specKey}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.specVal}>{String(val)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ulasan Komunitas</Text>
            {posts.length === 0 ? (
              <Text style={styles.empty}>Belum ada ulasan untuk gadget ini</Text>
            ) : (
              posts.map((p) => (
                <View key={p.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{p.user.displayName[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewName}>{p.user.displayName}</Text>
                      <Text style={styles.reviewType}>{p.type}</Text>
                    </View>
                    {p.rating && (
                      <View style={styles.reviewRating}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <Text style={styles.reviewRatingText}>{p.rating}/5</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewContent} numberOfLines={4}>{p.content}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  heroBox: { width: "100%", height: 260, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center" },
  heroImg: { width: "80%", height: "80%" },
  emoji: { fontSize: 80 },
  body: { padding: 16, gap: 12 },
  brand: { fontSize: 13, color: "#9ca3af" },
  name: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  badge: { backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, color: "#6b7280", textTransform: "capitalize" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "700", color: "#111" },
  reviewCount: { fontSize: 12, color: "#9ca3af" },
  actions: { flexDirection: "row", gap: 10 },
  compareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 12 },
  compareBtnText: { fontSize: 14, fontWeight: "600", color: "#111" },
  buyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 12 },
  buyBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  specsBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden" },
  specRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 12 },
  specKey: { width: 110, fontSize: 12, color: "#6b7280", textTransform: "capitalize", flexShrink: 0 },
  specVal: { flex: 1, fontSize: 12, fontWeight: "500", color: "#111" },
  empty: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 20 },
  reviewCard: { borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 12, padding: 12, gap: 8, backgroundColor: "#fafafa" },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  avatarText: { fontWeight: "700", fontSize: 13 },
  reviewName: { fontSize: 13, fontWeight: "600" },
  reviewType: { fontSize: 11, color: "#9ca3af", textTransform: "capitalize" },
  reviewRating: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 3 },
  reviewRatingText: { fontSize: 12, fontWeight: "600" },
  reviewContent: { fontSize: 13, color: "#374151", lineHeight: 20 },
});
