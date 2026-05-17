import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { api } from "../../src/lib/api";
import PostCard, { Post, timeAgo } from "../../src/components/PostCard";

const RED = "#d42b2b";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string; displayName: string; avatarUrl: string | null };
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/posts/${id}`);
      const data = res.data;
      setPost(data);
      setComments(data.comments ?? []);
    } catch {
      setError("Gagal memuat postingan.");
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comment`, { content: commentText.trim() });
      const newComment: Comment = res.data;
      setComments(prev => [...prev, newComment]);
      setCommentText("");
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch {
      // silently fail; could add error toast here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Postingan</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={RED} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchPost} style={styles.retryBtn}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : post ? (
          <>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Post */}
              <PostCard post={post} />

              {/* Comments section */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsSectionTitle}>
                  {comments.length} Komentar
                </Text>

                {comments.length === 0 ? (
                  <Text style={styles.emptyComments}>
                    Belum ada komentar. Jadilah yang pertama! 💬
                  </Text>
                ) : (
                  comments.map(comment => (
                    <CommentRow key={comment.id} comment={comment} />
                  ))
                )}
              </View>
            </ScrollView>

            {/* Sticky comment input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Tulis komentar..."
                placeholderTextColor="#9ca3af"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                onPress={submitComment}
                disabled={!commentText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        {comment.user.avatarUrl ? (
          <Image source={{ uri: comment.user.avatarUrl }} style={styles.commentAvatarImg} />
        ) : (
          <Text style={styles.commentAvatarText}>
            {comment.user.displayName[0]}
          </Text>
        )}
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentDisplayName}>{comment.user.displayName}</Text>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerRight: { width: 30 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 14, color: "#6b7280", marginBottom: 12, textAlign: "center" },
  retryBtn: { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "white", fontWeight: "600", fontSize: 14 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 8 },
  commentsSection: { backgroundColor: "white", borderRadius: 16, padding: 16 },
  commentsSectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 12 },
  emptyComments: { fontSize: 13, color: "#9ca3af", textAlign: "center", paddingVertical: 20 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: RED,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  commentAvatarImg: { width: 32, height: 32 },
  commentAvatarText: { color: "white", fontWeight: "700", fontSize: 13 },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  commentDisplayName: { fontSize: 11, fontWeight: "700", color: "#111827" },
  commentTime: { fontSize: 11, color: "#9ca3af" },
  commentContent: { fontSize: 14, color: "#374151", lineHeight: 20 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "white",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RED,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#d1d5db" },
});
