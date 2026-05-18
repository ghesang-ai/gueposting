import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, X, Sparkles, Send } from "lucide-react-native";
import { api } from "../src/lib/api";
import PostCard, { Post } from "../src/components/PostCard";

const RED = "#d42b2b";
const HEADER_RED = "#c0281f";

const TABS = [
  { value: "ai",      label: "GUE AI ✨" },
  { value: "posts",   label: "Post" },
  { value: "users",   label: "Orang" },
  { value: "gadgets", label: "Gadget" },
] as const;
type Tab = typeof TABS[number]["value"];

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟",
  wearable: "⌚", audio: "🎧", other: "🔌",
};

const AI_SUGGESTIONS = [
  "HP gaming terbaik di bawah 5 juta",
  "Laptop untuk mahasiswa tipis dan ringan",
  "Earphone wireless noise cancelling terbaik",
  "HP kamera terbaik budget 3 jutaan",
  "Smartwatch untuk olahraga terbaik",
];

interface User {
  id: string; username: string; displayName: string;
  avatarUrl: string | null; bio: string | null; trustScore: number;
}

interface Gadget {
  id: string; name: string; brand: string; category: string;
  imageUrl: string | null; avgScore: number; reviewCount: number;
}

interface AiGadget extends Gadget { reason?: string }

interface AiResult {
  answer: string;
  gadgets: AiGadget[];
}

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const aiInputRef = useRef<TextInput>(null);

  const [tab, setTab] = useState<Tab>("ai");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAsked, setAiAsked] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setPosts([]); setUsers([]); setGadgets([]); return; }
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "ai") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch, tab]);

  useEffect(() => {
    setTimeout(() => (tab === "ai" ? aiInputRef : inputRef).current?.focus(), 100);
  }, []);

  const askAI = async (q?: string) => {
    const question = (q ?? aiQuery).trim();
    if (!question || aiLoading) return;
    if (q) setAiQuery(q);
    setAiLoading(true);
    setAiAsked(true);
    setAiResult(null);
    try {
      const res = await api.post("/ai/ask", { question });
      setAiResult(res.data);
    } catch {
      setAiResult({ answer: "Maaf, GUE AI sedang sibuk. Coba lagi ya!", gadgets: [] });
    } finally { setAiLoading(false); }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} activeOpacity={0.8}
      onPress={() => router.push(`/profile/${item.username}` as any)}>
      <View style={styles.userAvatar}>
        {item.avatarUrl
          ? <Image source={{ uri: item.avatarUrl }} style={styles.userAvatarImg} />
          : <View style={[styles.userAvatarImg, styles.userAvatarFallback]}>
              <Text style={styles.userAvatarLetter}>{item.displayName[0]?.toUpperCase()}</Text>
            </View>}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userDisplayName}>{item.displayName}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.bio ? <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  const renderGadget = ({ item }: { item: Gadget }) => (
    <TouchableOpacity style={styles.gadgetCard} activeOpacity={0.8}
      onPress={() => router.push(`/gadget/${item.id}` as any)}>
      <View style={styles.gadgetImageBox}>
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={styles.gadgetImage} resizeMode="contain" />
          : <Text style={{ fontSize: 32 }}>{CATEGORY_EMOJI[item.category] ?? "📱"}</Text>}
      </View>
      <View style={styles.gadgetInfo}>
        <Text style={styles.gadgetName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.gadgetBrand}>{item.brand}</Text>
        {item.reviewCount > 0
          ? <Text style={styles.gadgetScore}>⭐ {item.avgScore?.toFixed(1)} · {item.reviewCount} review</Text>
          : null}
      </View>
    </TouchableOpacity>
  );

  const currentCount = tab === "posts" ? posts.length : tab === "users" ? users.length : gadgets.length;
  const isEmpty = !loading && query.trim() && currentCount === 0;

  // ── AI TAB CONTENT ────────────────────────────────────────────────────────
  const AiTab = () => (
    <ScrollView style={styles.aiScroll} contentContainerStyle={styles.aiContent}
      keyboardShouldPersistTaps="handled">
      {/* Branding */}
      <View style={styles.aiBrand}>
        <View style={styles.aiBrandIcon}>
          <Sparkles size={22} color="#fff" strokeWidth={1.8} />
        </View>
        <View>
          <Text style={styles.aiBrandTitle}>GUE AI Assistant</Text>
          <Text style={styles.aiBrandSub}>Tanya apa saja tentang gadget</Text>
        </View>
      </View>

      {/* Input */}
      <View style={styles.aiInputBox}>
        <TextInput
          ref={aiInputRef}
          style={styles.aiInput}
          placeholder="Contoh: HP gaming terbaik di bawah 5 juta..."
          placeholderTextColor="#9ca3af"
          value={aiQuery}
          onChangeText={setAiQuery}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => askAI()}
        />
        <TouchableOpacity
          style={[styles.aiSendBtn, (!aiQuery.trim() || aiLoading) && { opacity: 0.4 }]}
          onPress={() => askAI()}
          disabled={!aiQuery.trim() || aiLoading}
        >
          {aiLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Send size={18} color="#fff" strokeWidth={2} />}
        </TouchableOpacity>
      </View>

      {/* Suggestions — shown before first ask */}
      {!aiAsked && (
        <View style={styles.suggestionsBox}>
          <Text style={styles.suggestionsLabel}>💡 Coba tanya:</Text>
          {AI_SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => askAI(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
              <Text style={{ color: RED, fontSize: 13 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Loading */}
      {aiLoading && (
        <View style={styles.aiLoadingBox}>
          <ActivityIndicator color={RED} />
          <Text style={styles.aiLoadingText}>GUE AI sedang berpikir...</Text>
        </View>
      )}

      {/* Result */}
      {aiResult && !aiLoading && (
        <View style={styles.aiResultBox}>
          {/* Answer bubble */}
          <View style={styles.aiBubble}>
            <View style={styles.aiBubbleHeader}>
              <View style={styles.aiBubbleIcon}>
                <Sparkles size={14} color="#fff" strokeWidth={2} />
              </View>
              <Text style={styles.aiBubbleName}>GUE AI</Text>
            </View>
            <Text style={styles.aiBubbleText}>{aiResult.answer}</Text>
          </View>

          {/* Gadget recommendations */}
          {aiResult.gadgets.length > 0 && (
            <View style={styles.aiGadgetSection}>
              <Text style={styles.aiGadgetTitle}>Rekomendasi Untukmu:</Text>
              {aiResult.gadgets.map((g, i) => (
                <TouchableOpacity key={g.id} style={styles.aiGadgetCard}
                  onPress={() => router.push(`/gadget/${g.id}` as any)} activeOpacity={0.8}>
                  <Text style={styles.aiGadgetRank}>{i + 1}</Text>
                  <View style={styles.aiGadgetImgBox}>
                    {g.imageUrl
                      ? <Image source={{ uri: g.imageUrl }} style={styles.aiGadgetImg} resizeMode="contain" />
                      : <Text style={{ fontSize: 28 }}>{CATEGORY_EMOJI[g.category] ?? "📱"}</Text>}
                  </View>
                  <View style={styles.aiGadgetInfo}>
                    <Text style={styles.aiGadgetName} numberOfLines={1}>{g.brand} {g.name}</Text>
                    {g.reason ? (
                      <Text style={styles.aiGadgetReason} numberOfLines={2}>{g.reason}</Text>
                    ) : null}
                    {(g.reviewCount ?? 0) > 0
                      ? <Text style={styles.aiGadgetScore}>⭐ {g.avgScore?.toFixed(1)} · {g.reviewCount} review komunitas</Text>
                      : null}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Compare button */}
              {aiResult.gadgets.length >= 2 && (
                <TouchableOpacity
                  style={styles.compareBtn}
                  onPress={() => router.push("/(tabs)/compare" as any)}
                >
                  <Text style={styles.compareBtnText}>⚖️ Lihat Perbandingan</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Ask again */}
          <TouchableOpacity style={styles.askAgainBtn} onPress={() => {
            setAiAsked(false); setAiResult(null); setAiQuery("");
            setTimeout(() => aiInputRef.current?.focus(), 100);
          }}>
            <Text style={styles.askAgainText}>Tanya hal lain ↩</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        {tab !== "ai" ? (
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
        ) : (
          <Text style={styles.headerAiTitle}>Search & Ask</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((t) => {
          const count = t.value === "posts" ? posts.length
            : t.value === "users" ? users.length
            : t.value === "gadgets" ? gadgets.length : 0;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tabBtn, tab === t.value && styles.tabBtnActive,
                t.value === "ai" && styles.tabBtnAi,
                tab === t.value && t.value === "ai" && styles.tabBtnAiActive]}
              onPress={() => {
                setTab(t.value);
                if (t.value !== "ai") setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Text style={[styles.tabText,
                tab === t.value && styles.tabTextActive,
                t.value === "ai" && styles.tabTextAi,
                tab === t.value && t.value === "ai" && styles.tabTextAiActive]}>
                {t.label}{query.trim() && count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {tab === "ai" ? (
        <AiTab />
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={RED} /></View>
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
        <FlatList data={posts} keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false} />
      ) : tab === "users" ? (
        <FlatList data={users} keyExtractor={(u) => u.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false} />
      ) : (
        <FlatList data={gadgets} keyExtractor={(g) => g.id}
          renderItem={renderGadget}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    backgroundColor: HEADER_RED, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: { padding: 2 },
  headerAiTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff", textAlign: "center", marginRight: 28 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111", padding: 0 },

  tabsBar: {
    flexDirection: "row", backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingHorizontal: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 11, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: RED },
  tabBtnAi: { flex: 1.4 },
  tabBtnAiActive: { borderBottomColor: RED },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: RED },
  tabTextAi: { color: RED, fontWeight: "700" },
  tabTextAiActive: { color: RED },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hintText: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingHorizontal: 32 },
  listContent: { padding: 12, gap: 10 },

  // ── AI Tab ──────────────────────────────────────────────────────────────
  aiScroll: { flex: 1 },
  aiContent: { padding: 16, gap: 16, paddingBottom: 40 },

  aiBrand: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  aiBrandIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: RED, justifyContent: "center", alignItems: "center",
  },
  aiBrandTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  aiBrandSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  aiInputBox: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    backgroundColor: "#fff", borderRadius: 16, padding: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1.5, borderColor: "#fecaca",
  },
  aiInput: { flex: 1, fontSize: 14, color: "#111", maxHeight: 100, lineHeight: 20 },
  aiSendBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: RED, justifyContent: "center", alignItems: "center",
  },

  suggestionsBox: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, gap: 8,
  },
  suggestionsLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 2 },
  suggestionChip: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: "#f9fafb", borderRadius: 12,
    borderWidth: 1, borderColor: "#f3f4f6",
  },
  suggestionText: { fontSize: 13, color: "#374151", flex: 1 },

  aiLoadingBox: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", padding: 20 },
  aiLoadingText: { fontSize: 14, color: "#6b7280" },

  aiResultBox: { gap: 12 },
  aiBubble: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderLeftWidth: 3, borderLeftColor: RED,
  },
  aiBubbleHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  aiBubbleIcon: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: RED, justifyContent: "center", alignItems: "center",
  },
  aiBubbleName: { fontSize: 13, fontWeight: "700", color: RED },
  aiBubbleText: { fontSize: 14, color: "#111", lineHeight: 22 },

  aiGadgetSection: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, gap: 12,
  },
  aiGadgetTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  aiGadgetCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, backgroundColor: "#f9fafb",
    borderRadius: 14, borderWidth: 1, borderColor: "#f3f4f6",
  },
  aiGadgetRank: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: RED, color: "#fff",
    fontSize: 12, fontWeight: "700",
    textAlign: "center", lineHeight: 22,
    flexShrink: 0,
  },
  aiGadgetImgBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center", overflow: "hidden", flexShrink: 0,
  },
  aiGadgetImg: { width: 46, height: 46 },
  aiGadgetInfo: { flex: 1 },
  aiGadgetName: { fontSize: 14, fontWeight: "700", color: "#111" },
  aiGadgetReason: { fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 17 },
  aiGadgetScore: { fontSize: 11, color: "#9ca3af", marginTop: 3 },

  compareBtn: {
    backgroundColor: RED, borderRadius: 14,
    paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  compareBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  askAgainBtn: { alignItems: "center", paddingVertical: 8 },
  askAgainText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },

  // ── User card ────────────────────────────────────────────────────────────
  userCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  userAvatar: { flexShrink: 0 },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  userAvatarFallback: { backgroundColor: RED, justifyContent: "center", alignItems: "center" },
  userAvatarLetter: { color: "#fff", fontWeight: "700", fontSize: 18 },
  userInfo: { flex: 1 },
  userDisplayName: { fontSize: 15, fontWeight: "700", color: "#111" },
  userUsername: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  userBio: { fontSize: 12, color: "#9ca3af", marginTop: 3 },

  // ── Gadget card ──────────────────────────────────────────────────────────
  gadgetCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  gadgetImageBox: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: "#f9fafb",
    borderWidth: 1, borderColor: "#e5e7eb", justifyContent: "center",
    alignItems: "center", overflow: "hidden",
  },
  gadgetImage: { width: 54, height: 54 },
  gadgetInfo: { flex: 1 },
  gadgetName: { fontSize: 15, fontWeight: "700", color: "#111" },
  gadgetBrand: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  gadgetScore: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
});
