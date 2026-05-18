import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { api } from "../src/lib/api";

const RED = "#d42b2b";

interface Notif {
  id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  createdAt: string;
  actor: { id: string; username: string; displayName: string; avatarUrl: string | null };
  post: { id: string; content: string } | null;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function notifMessage(n: Notif) {
  if (n.type === "follow") return "mulai mengikutimu";
  if (n.type === "like") return "menyukai postinganmu";
  if (n.type === "comment") return "berkomentar di postinganmu";
  return "";
}

function notifEmoji(type: string) {
  if (type === "follow") return "👤";
  if (type === "like") return "❤️";
  if (type === "comment") return "💬";
  return "🔔";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifs(res.data ?? []);
      // mark all read silently
      api.patch("/notifications/read-all").catch(() => {});
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: Notif }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => {
        if (item.post) router.push(`/post/${item.post.id}` as any);
        else router.push(`/profile/${item.actor.username}` as any);
      }}
      activeOpacity={0.75}
    >
      {/* Avatar + emoji badge */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          {item.actor.avatarUrl
            ? <Image source={{ uri: item.actor.avatarUrl }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{item.actor.displayName[0]}</Text>}
        </View>
        <View style={styles.emojiDot}>
          <Text style={styles.emojiDotText}>{notifEmoji(item.type)}</Text>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={styles.notifText} numberOfLines={2}>
          <Text style={styles.actorName}>{item.actor.displayName} </Text>
          {notifMessage(item)}
        </Text>
        {item.post && (
          <Text style={styles.postSnippet} numberOfLines={1}>{item.post.content}</Text>
        )}
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>

      {/* Unread dot */}
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={RED} size="large" />
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
          <Bell size={48} color="#d1d5db" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
          <Text style={styles.emptySub}>Notifikasi like, komentar, dan follow akan muncul di sini.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 24 }}
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#fff",
  },
  rowUnread: { backgroundColor: "#fff5f5" },
  separator: { height: 1, backgroundColor: "#f3f4f6" },

  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: RED, overflow: "hidden",
    justifyContent: "center", alignItems: "center",
  },
  avatarImg: { width: 46, height: 46 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  emojiDot: {
    position: "absolute", bottom: -2, right: -4,
    backgroundColor: "#fff", borderRadius: 10, padding: 1,
  },
  emojiDotText: { fontSize: 14 },

  textWrap: { flex: 1 },
  notifText: { fontSize: 14, color: "#111827", lineHeight: 20 },
  actorName: { fontWeight: "700" },
  postSnippet: {
    fontSize: 12, color: "#6b7280", marginTop: 3,
    backgroundColor: "#f3f4f6", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    overflow: "hidden",
  },
  time: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: RED, flexShrink: 0,
  },
});
