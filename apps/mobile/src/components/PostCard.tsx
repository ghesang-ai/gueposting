import { useState } from "react";
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
} from "react-native";
import { Heart, MessageCircle, Bookmark, Share2, Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";

const RED = "#d42b2b";

export interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
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

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const router = useRouter();

  const toggleLike = async () => {
    // optimistic update first
    setLiked(prev => !prev);
    setLikeCount(n => liked ? n - 1 : n + 1);
    try {
      await api.post(`/posts/${post.id}/like`); // always POST, backend toggles
    } catch {
      // revert on error
      setLiked(prev => !prev);
      setLikeCount(n => liked ? n + 1 : n - 1);
    }
  };

  const toggleBookmark = async () => {
    setBookmarked(prev => !prev);
    try {
      await api.post(`/posts/${post.id}/bookmark`); // always POST, backend toggles
    } catch {
      setBookmarked(prev => !prev);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userRow}>
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
        </View>
        <TouchableOpacity>
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

      {post.mediaUrls.length > 0 && (
        <View style={[styles.mediaGrid, post.mediaUrls.length > 1 && { flexDirection: "row", flexWrap: "wrap" }]}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <Image
              key={i}
              source={{ uri: url }}
              style={[styles.mediaImg, post.mediaUrls.length > 1 && { width: "49.5%", aspectRatio: 1 }]}
              resizeMode="cover"
            />
          ))}
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
  mediaGrid: { borderRadius: 12, overflow: "hidden", marginBottom: 10, gap: 2 },
  mediaImg: { width: "100%", height: 200, borderRadius: 12 },
  actions: { flexDirection: "row", alignItems: "center", gap: 20, borderTopWidth: 1, borderTopColor: "#f9fafb", paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "500", color: "#9ca3af" },
});
