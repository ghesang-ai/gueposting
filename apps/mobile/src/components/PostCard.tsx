import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Alert,
  ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { Heart, MessageCircle, Bookmark, Share2, Star, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

const { width: SCREEN_W } = Dimensions.get("window");
const IMG_W = SCREEN_W - 56; // 12+12 outer list padding + 16+16 card padding

const RED = "#d42b2b";

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string | null;
  userVotes?: string[];
  multipleChoice?: boolean;
  expiresAt?: string;
}

export interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  location?: string | null;
  isLiked?: boolean;
  isBookmarked?: boolean;
  poll?: Poll | null;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; trustScore: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
}

export function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function PostCard({ post, onDelete }: { post: Post; onDelete?: () => void }) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [poll, setPoll] = useState<Poll | null>(post.poll ?? null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const router = useRouter();
  const { user } = useAuthStore();

  const isOwner = user?.id === post.user.id;
  const hasVoted = poll != null && (
    poll.userVote != null || (poll.userVotes != null && poll.userVotes.length > 0)
  );

  const toggleLike = async () => {
    setLiked(prev => !prev);
    setLikeCount(n => liked ? n - 1 : n + 1);
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      setLiked(prev => !prev);
      setLikeCount(n => liked ? n + 1 : n - 1);
    }
  };

  const toggleBookmark = async () => {
    setBookmarked(prev => !prev);
    try {
      await api.post(`/posts/${post.id}/bookmark`);
    } catch {
      setBookmarked(prev => !prev);
    }
  };

  const deletePost = () => {
    Alert.alert("Hapus Postingan?", "Postingan ini akan dihapus permanen.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/posts/${post.id}`);
            onDelete?.();
          } catch {
            Alert.alert("Gagal", "Gagal menghapus postingan.");
          }
        },
      },
    ]);
  };

  const showMoreMenu = () => {
    Alert.alert("Opsi", undefined, [
      { text: "Salin Link Post", onPress: () => {} },
      { text: "Laporkan", onPress: () => {} },
      ...(isOwner ? [{ text: "Hapus", style: "destructive" as const, onPress: deletePost }] : []),
      { text: "Batal", style: "cancel" as const },
    ]);
  };

  const toggleOption = (optionId: string) => {
    if (!poll?.multipleChoice) {
      setSelectedOptions(new Set([optionId]));
    } else {
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
        return next;
      });
    }
  };

  const submitVote = async () => {
    if (!poll || selectedOptions.size === 0) return;
    setVoting(true);
    try {
      const res = await api.post(`/posts/${post.id}/poll/vote`, {
        optionIds: Array.from(selectedOptions),
      });
      setPoll(res.data);
      setSelectedOptions(new Set());
    } catch {
      Alert.alert("Gagal", "Gagal memilih.");
    } finally {
      setVoting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity style={styles.userRow} onPress={() => router.push(`/profile/${post.user.username}` as any)}>
          <View style={styles.avatar}>
            {post.user.avatarUrl
              ? <Image source={{ uri: post.user.avatarUrl }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{post.user.displayName[0]}</Text>}
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.displayName}>{post.user.displayName}</Text>
              {post.user.trustScore >= 70 && (
                <Text style={{ color: RED, fontSize: 12 }}>✓</Text>
              )}
            </View>
            <Text style={styles.username}>@{post.user.username} · {timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={showMoreMenu}>
          <Text style={styles.moreBtn}>•••</Text>
        </TouchableOpacity>
      </View>

      {post.gadget && (
        <View style={styles.gadgetTag}>
          {post.gadget.imageUrl && (
            <Image source={{ uri: post.gadget.imageUrl }} style={styles.gadgetImg} />
          )}
          <Text style={styles.gadgetName}>{post.gadget.brand} {post.gadget.name}</Text>
          {post.rating && (
            <View style={styles.ratingRow}>
              <Star size={11} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{post.rating}/10</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.content}>{post.content}</Text>

      {post.location ? (
        <View style={styles.locationChip}>
          <MapPin size={12} color="#6b7280" />
          <Text style={styles.locationText}>{post.location}</Text>
        </View>
      ) : null}

      {post.mediaUrls.length > 0 && (
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / IMG_W);
              setImgIndex(idx);
            }}
            scrollEventThrottle={16}
          >
            {post.mediaUrls.slice(0, 4).map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={{ width: IMG_W, height: 220, borderRadius: 12 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {post.mediaUrls.length > 1 && (
            <View style={styles.dots}>
              {post.mediaUrls.slice(0, 4).map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Poll */}
      {poll && (
        <View style={styles.pollBox}>
          <Text style={styles.pollQuestion}>{poll.question}</Text>
          {poll.options.map(opt => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
            const isVoted = hasVoted && (poll.userVote === opt.id || poll.userVotes?.includes(opt.id));
            const isSelected = selectedOptions.has(opt.id);

            if (hasVoted) {
              return (
                <View key={opt.id} style={styles.pollResultRow}>
                  <View style={[styles.pollBar, { width: `${pct}%` as any }]} />
                  <View style={styles.pollResultInner}>
                    <View style={[styles.pollCheckCircle, isVoted && styles.pollCheckCircleActive]}>
                      {isVoted && <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>✓</Text>}
                    </View>
                    <Text style={styles.pollOptText}>{opt.text}</Text>
                    <Text style={styles.pollPct}>{pct}%</Text>
                  </View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.pollOption, isSelected && styles.pollOptionSelected]}
                onPress={() => toggleOption(opt.id)}
              >
                <View style={[
                  poll.multipleChoice ? styles.checkbox : styles.radio,
                  isSelected && styles.checkboxActive,
                ]}>
                  {isSelected && <Text style={{ color: "#fff", fontSize: 9 }}>✓</Text>}
                </View>
                <Text style={styles.pollOptText}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}

          {!hasVoted && selectedOptions.size > 0 && (
            <TouchableOpacity
              style={[styles.voteBtn, voting && { opacity: 0.6 }]}
              onPress={submitVote}
              disabled={voting}
            >
              <Text style={styles.voteBtnText}>
                {voting ? "Memilih..." : poll.multipleChoice ? `Pilih (${selectedOptions.size})` : "Pilih"}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.pollMeta}>
            {poll.totalVotes} suara · {poll.multipleChoice ? "Boleh pilih banyak" : "Satu pilihan"}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Heart size={18} color={liked ? RED : "#9ca3af"} fill={liked ? RED : "none"} strokeWidth={1.8} />
          <Text style={[styles.actionText, liked && { color: RED }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}` as any)}>
          <MessageCircle size={18} color="#9ca3af" strokeWidth={1.8} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={16} color="#9ca3af" strokeWidth={1.8} />
          <Text style={styles.actionText}>Bagikan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: "auto" }} onPress={toggleBookmark}>
          <Bookmark size={18} color={bookmarked ? RED : "#9ca3af"} fill={bookmarked ? RED : "none"} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: RED, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: "white", fontWeight: "700", fontSize: 15 },
  displayName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  username: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  moreBtn: { color: "#9ca3af", fontSize: 16, letterSpacing: 1 },
  gadgetTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, gap: 8 },
  gadgetImg: { width: 28, height: 28, borderRadius: 6 },
  gadgetName: { fontSize: 12, fontWeight: "600", flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11, fontWeight: "700", color: "#f59e0b" },
  content: { fontSize: 14, lineHeight: 22, color: "#111827", marginBottom: 10 },
  locationChip: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  locationText: { fontSize: 12, color: "#6b7280" },
  carouselWrap: { marginBottom: 10 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: RED, width: 16 },

  // Poll
  pollBox: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 14, marginBottom: 10 },
  pollQuestion: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10 },
  pollOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    backgroundColor: "#fff", marginBottom: 8,
  },
  pollOptionSelected: { borderColor: RED, backgroundColor: "#fff5f5" },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: "#d1d5db",
    justifyContent: "center", alignItems: "center",
  },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: "#d1d5db",
    justifyContent: "center", alignItems: "center",
  },
  checkboxActive: { backgroundColor: RED, borderColor: RED },
  pollOptText: { flex: 1, fontSize: 13, color: "#374151" },
  pollResultRow: {
    position: "relative", marginBottom: 8,
    borderRadius: 10, overflow: "hidden",
    backgroundColor: "#f3f4f6", height: 40,
  },
  pollBar: { position: "absolute", top: 0, left: 0, bottom: 0, backgroundColor: "#fecaca", borderRadius: 10 },
  pollResultInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 40 },
  pollCheckCircle: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: "#d1d5db",
    justifyContent: "center", alignItems: "center",
  },
  pollCheckCircleActive: { backgroundColor: RED, borderColor: RED },
  pollPct: { fontSize: 12, fontWeight: "700", color: "#374151" },
  voteBtn: {
    backgroundColor: RED, borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
    marginTop: 4, marginBottom: 8,
  },
  voteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pollMeta: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 2 },

  actions: { flexDirection: "row", alignItems: "center", gap: 20, borderTopWidth: 1, borderTopColor: "#f9fafb", paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "500", color: "#9ca3af" },
});
