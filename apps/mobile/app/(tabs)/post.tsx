import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import {
  ArrowLeft,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { api, API_URL } from "../../src/lib/api";
import { useAuthStore } from "../../src/stores/auth";

// ── constants ──────────────────────────────────────────────────────────────

const POST_TYPES = [
  { value: "review", label: "Review", emoji: "⭐" },
  { value: "photo", label: "Foto", emoji: "📷" },
  { value: "video", label: "Video", emoji: "🎬" },
  { value: "discussion", label: "Diskusi", emoji: "💬" },
  { value: "other", label: "Lainnya", emoji: "···" },
] as const;
type PostType = (typeof POST_TYPES)[number]["value"];

const TOPICS = [
  "#Diskusi",
  "#Review",
  "#Event",
  "#Tips & Trik",
  "#Rekomendasi",
  "#Unboxing",
  "#Versus",
  "#Harga",
];

const PLACEHOLDERS: Record<PostType, string> = {
  review: "Tulis review jujur kamu tentang gadget ini...",
  photo: "Ceritakan foto yang kamu bagikan...",
  video: "Deskripsi video kamu...",
  discussion: "Mulai diskusi seru dengan komunitas GUEPOSTING...",
  other: "Apa yang ingin kamu bagikan?",
};

// ── types ──────────────────────────────────────────────────────────────────

interface Gadget {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  emoji?: string;
}

// ── component ──────────────────────────────────────────────────────────────

export default function PostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // form state
  const [postType, setPostType] = useState<PostType>("review");
  const [content, setContent] = useState("");
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);

  // gadget picker
  const [gadgetSearch, setGadgetSearch] = useState("");
  const [gadgetResults, setGadgetResults] = useState<Gadget[]>([]);
  const [trendingGadgets, setTrendingGadgets] = useState<Gadget[]>([]);
  const [selectedGadget, setSelectedGadget] = useState<Gadget | null>(null);
  const [gadgetLoading, setGadgetLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // upload / submit
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // fetch trending gadgets on mount
  useEffect(() => {
    api
      .get<{ gadgets: Gadget[] }>("/gadgets/trending")
      .then((res) => setTrendingGadgets(res.data?.gadgets ?? []))
      .catch(() => {});
  }, []);

  // debounced gadget search
  const handleGadgetSearch = useCallback((text: string) => {
    setGadgetSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setGadgetResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setGadgetLoading(true);
      try {
        const res = await api.get<{ gadgets: Gadget[] }>(
          `/gadgets?search=${encodeURIComponent(text)}&limit=6`
        );
        setGadgetResults(res.data?.gadgets ?? []);
      } catch {
        setGadgetResults([]);
      } finally {
        setGadgetLoading(false);
      }
    }, 300);
  }, []);

  const selectGadget = (g: Gadget) => {
    setSelectedGadget(g);
    setGadgetSearch("");
    setGadgetResults([]);
  };

  // image picker + upload
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Diperlukan",
        "Izinkan akses ke galeri foto untuk upload gambar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4 - images.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 4));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const token = await SecureStore.getItemAsync("token");
    const urls: string[] = [];
    for (const uri of images) {
      const form = new FormData();
      form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }
    return urls;
  };

  const submit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        mediaUrls = await uploadImages();
        setUploading(false);
      }
      await api.post("/posts", {
        content: content.trim(),
        type: postType,
        gadgetId: selectedGadget?.id,
        rating:
          postType === "review" && ratingValue != null ? ratingValue : undefined,
        mediaUrls,
      });
      Alert.alert("Berhasil!", "Postingan kamu sudah dipublish.", [
        {
          text: "OK",
          onPress: () => {
            setContent("");
            setImages([]);
            setRatingValue(null);
            setSelectedGadget(null);
            setSelectedTopic(null);
            router.back();
          },
        },
      ]);
    } catch {
      Alert.alert("Gagal", "Gagal memposting. Coba lagi.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const isDisabled = !content.trim() || submitting;

  const visibleTopics = showAllTopics ? TOPICS : TOPICS.slice(0, 5);

  // ── helpers ──────────────────────────────────────────────────────────────

  const avatarInitial = user?.displayName?.[0]?.toUpperCase() ?? "?";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, isDisabled && styles.postBtnDisabled]}
          onPress={submit}
          disabled={isDisabled}
        >
          {submitting ? (
            <ActivityIndicator color="#c0281f" size="small" />
          ) : (
            <Text style={styles.postBtnText}>
              {uploading ? "Upload..." : "Post"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── User info card ── */}
          <View style={styles.card}>
            <View style={styles.userRow}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{avatarInitial}</Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>
                    {user?.displayName ?? "Kamu"}
                  </Text>
                  {(user?.trustScore ?? 0) >= 70 && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.audiencePill}>
                  <Text style={styles.audienceText}>🌐 Publik</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Tipe Postingan ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TIPE POSTINGAN</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {POST_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt.value}
                  onPress={() => setPostType(pt.value)}
                  style={[
                    styles.typeChip,
                    postType === pt.value && styles.typeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      postType === pt.value && styles.typeChipTextActive,
                    ]}
                  >
                    {pt.emoji} {pt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Gadget Picker ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>GADGET (OPSIONAL)</Text>

            {/* selected gadget pill */}
            {selectedGadget && (
              <View style={styles.selectedGadgetPill}>
                <Text style={styles.selectedGadgetText}>
                  ✓ {selectedGadget.brand} {selectedGadget.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedGadget(null)}>
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* search input */}
            <View style={styles.searchRow}>
              <Search size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari atau pilih gadget..."
                placeholderTextColor="#9ca3af"
                value={gadgetSearch}
                onChangeText={handleGadgetSearch}
              />
              {gadgetLoading && (
                <ActivityIndicator size="small" color="#9ca3af" />
              )}
            </View>

            {/* search results dropdown */}
            {gadgetResults.length > 0 && (
              <View style={styles.gadgetDropdown}>
                {gadgetResults.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.gadgetRow}
                    onPress={() => selectGadget(g)}
                  >
                    <Text style={styles.gadgetEmoji}>{g.emoji ?? "📱"}</Text>
                    <View>
                      <Text style={styles.gadgetName}>{g.name}</Text>
                      <Text style={styles.gadgetBrand}>{g.brand}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* trending gadgets */}
            {trendingGadgets.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.trendingScroll}
              >
                {trendingGadgets.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.trendingCard,
                      selectedGadget?.id === g.id &&
                        styles.trendingCardActive,
                    ]}
                    onPress={() =>
                      selectedGadget?.id === g.id
                        ? setSelectedGadget(null)
                        : selectGadget(g)
                    }
                  >
                    {g.imageUrl ? (
                      <Image
                        source={{ uri: g.imageUrl }}
                        style={styles.trendingImg}
                      />
                    ) : (
                      <Text style={styles.trendingEmoji}>
                        {g.emoji ?? "📱"}
                      </Text>
                    )}
                    <Text style={styles.trendingName} numberOfLines={2}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Topik ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TOPIK (OPSIONAL)</Text>
            <View style={styles.topicsWrap}>
              {visibleTopics.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  onPress={() =>
                    setSelectedTopic(selectedTopic === topic ? null : topic)
                  }
                  style={[
                    styles.topicChip,
                    selectedTopic === topic && styles.topicChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.topicText,
                      selectedTopic === topic && styles.topicTextActive,
                    ]}
                  >
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.topicToggle}
                onPress={() => setShowAllTopics((v) => !v)}
              >
                {showAllTopics ? (
                  <ChevronUp size={18} color="#6b7280" />
                ) : (
                  <ChevronDown size={18} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Rating (review only) ── */}
          {postType === "review" && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>RATING (1–10)</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() =>
                      setRatingValue(ratingValue === n ? null : n)
                    }
                    style={[
                      styles.ratingBtn,
                      ratingValue === n && styles.ratingBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ratingBtnText,
                        ratingValue === n && styles.ratingBtnTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Konten ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>KONTEN</Text>
            <TextInput
              style={styles.textarea}
              placeholder={PLACEHOLDERS[postType]}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              maxLength={2000}
            />
            <Text style={styles.charCount}>{content.length}/2000</Text>

            {/* AI stub buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.aiRow}
            >
              <TouchableOpacity style={styles.aiBtn}>
                <Text style={styles.aiBtnText}>✨ AI Bantu Tulis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiBtn}>
                <Text style={styles.aiBtnText}>💡 Buat lebih menarik</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiBtn}>
                <Text style={styles.aiBtnText}>✏ Rapikan tulisan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* ── Media ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>MEDIA (OPSIONAL)</Text>
            <View style={styles.mediaRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.mediaThumbWrap}>
                  <Image source={{ uri }} style={styles.mediaThumb} />
                  <TouchableOpacity
                    style={styles.mediaRemoveBtn}
                    onPress={() =>
                      setImages((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 4 && (
                <TouchableOpacity style={styles.addMediaBtn} onPress={pickImage}>
                  <Text style={styles.addMediaPlus}>+</Text>
                  <Text style={styles.addMediaLabel}>Tambah Media</Text>
                </TouchableOpacity>
              )}
            </View>
            {images.length === 0 && (
              <Text style={styles.mediaTip}>
                💡 Tambahkan foto/video untuk mendapatkan lebih banyak interaksi
              </Text>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────

const RED = "#c0281f";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: RED },
  scroll: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { padding: 12 },
  bottomSpacer: { height: 40 },

  // header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  postBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: RED, fontWeight: "700", fontSize: 14 },

  // card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // user info
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "#fff", fontWeight: "700", fontSize: 16 },
  userInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 15, fontWeight: "700", color: "#111" },
  checkBadge: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  checkText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  audiencePill: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  audienceText: { fontSize: 12, color: "#374151", fontWeight: "500" },

  // type chips
  chipsScroll: { marginTop: 2 },
  typeChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  typeChipActive: { backgroundColor: "#111" },
  typeChipText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },

  // gadget picker
  selectedGadgetPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: RED,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    gap: 6,
  },
  selectedGadgetText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  gadgetDropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  gadgetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  gadgetEmoji: { fontSize: 22 },
  gadgetName: { fontSize: 13, fontWeight: "600", color: "#111" },
  gadgetBrand: { fontSize: 11, color: "#6b7280" },
  trendingScroll: { marginTop: 12 },
  trendingCard: {
    width: 80,
    alignItems: "center",
    marginRight: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  trendingCardActive: { borderColor: RED, backgroundColor: "#fff5f5" },
  trendingImg: { width: 44, height: 44, borderRadius: 8, marginBottom: 4 },
  trendingEmoji: { fontSize: 32, marginBottom: 4 },
  trendingName: {
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
  },

  // topics
  topicsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  topicChipActive: { backgroundColor: "#d42b2b" },
  topicText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  topicTextActive: { color: "#fff" },
  topicToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  // rating
  ratingRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ratingBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBtnActive: { backgroundColor: "#f59e0b" },
  ratingBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  ratingBtnTextActive: { color: "#fff" },

  // content
  textarea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111",
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  aiRow: { marginTop: 10 },
  aiBtn: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  aiBtnText: { fontSize: 12, color: "#374151", fontWeight: "500" },

  // media
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaThumbWrap: { position: "relative" },
  mediaThumb: { width: 80, height: 80, borderRadius: 10 },
  mediaRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 3,
  },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  addMediaPlus: { fontSize: 22, color: "#9ca3af", lineHeight: 26 },
  addMediaLabel: { fontSize: 10, color: "#9ca3af", textAlign: "center" },
  mediaTip: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
});
