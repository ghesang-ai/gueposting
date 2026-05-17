import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Link2, MapPin } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../src/lib/api";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", emoji: "📸", placeholder: "username" },
  { key: "youtube",   label: "YouTube",   emoji: "▶️", placeholder: "channel name" },
  { key: "tiktok",    label: "TikTok",    emoji: "🎵", placeholder: "@username" },
  { key: "twitter",   label: "X (Twitter)", emoji: "𝕏", placeholder: "@username" },
] as const;
type SocialKey = typeof SOCIAL_PLATFORMS[number]["key"];

const RED = "#d42b2b";

async function uploadImage(uri: string): Promise<string> {
  const token = await SecureStore.getItemAsync("token");
  const formData = new FormData();
  formData.append("file", { uri, name: "image.jpg", type: "image/jpeg" } as any);
  const res = await fetch(`${API_URL}/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload gagal (${res.status}): ${err}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("Response tidak mengandung URL");
  return data.url;
}

export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    instagram: "", youtube: "", tiktok: "", twitter: "",
  });
  const [showOnline, setShowOnline] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const data = res.data?.data ?? res.data;
        setDisplayName(data.displayName ?? "");
        setBio(data.bio ?? "");
        setLocation(data.location ?? "");
        setWebsite(data.website ?? "");
        setAvatarUrl(data.avatarUrl ?? null);
        setCoverUrl(data.coverUrl ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingCover(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setCoverUrl(url);
      } catch (e: any) {
        Alert.alert("Gagal Upload Cover", e?.message ?? "Tidak dapat mengunggah foto cover. Coba lagi.");
      } finally {
        setUploadingCover(false);
      }
    }
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setAvatarUrl(url);
      } catch (e: any) {
        Alert.alert("Gagal Upload Foto", e?.message ?? "Tidak dapat mengunggah foto profil. Coba lagi.");
      } finally {
        setUploadingAvatar(false);
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch("/auth/profile", {
        displayName,
        bio,
        location,
        website,
        avatarUrl,
        coverUrl,
      });
      Alert.alert("Berhasil", "Profil berhasil diperbarui.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RED} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerBtn}>
          <ArrowLeft size={22} color="#111" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={8} style={styles.headerBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={RED} />
          ) : (
            <Text style={styles.headerSave}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverContainer}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <TouchableOpacity
            style={[styles.changeCoverBtn, uploadingCover && { opacity: 0.7 }]}
            onPress={pickCover}
            disabled={uploadingCover}
          >
            {uploadingCover
              ? <ActivityIndicator size="small" color="white" />
              : <Camera size={14} color="white" strokeWidth={2} />
            }
            <Text style={styles.changeCoverText}>
              {uploadingCover ? "Mengupload..." : "Ubah Cover"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} disabled={uploadingAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{displayName[0] ?? "?"}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="white" />
                : <Camera size={14} color="white" strokeWidth={2} />
              }
            </View>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nama Tampilan</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nama tampilan kamu"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="Ceritakan sedikit tentang kamu..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Lokasi</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Kota, Negara"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://website-kamu.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Preferensi */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PREFERENSI</Text>
          <ToggleRow
            label="Tampilkan status online"
            sub="Orang lain dapat melihat saat kamu online"
            value={showOnline}
            onChange={setShowOnline}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Izinkan pesan dari semua orang"
            sub="Semua orang bisa mengirimiku pesan"
            value={allowMessages}
            onChange={setAllowMessages}
          />
        </View>

        {/* Tautan Sosial */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>TAUTAN SOSIAL</Text>
          {SOCIAL_PLATFORMS.map((s, i) => (
            <View key={s.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.socialRow}>
                <Text style={styles.socialEmoji}>{s.emoji}</Text>
                <View style={styles.socialInfo}>
                  <Text style={styles.socialLabel}>{s.label}</Text>
                  <TextInput
                    style={styles.socialInput}
                    value={socialLinks[s.key]}
                    onChangeText={v => setSocialLinks(prev => ({ ...prev, [s.key]: v }))}
                    placeholder={s.placeholder}
                    placeholderTextColor="#d1d5db"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerBtn: { minWidth: 60, alignItems: "flex-start" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerSave: { fontSize: 15, fontWeight: "700", color: RED },

  // Cover
  coverContainer: { position: "relative", height: 140 },
  coverImage: { width: "100%", height: 140 },
  coverPlaceholder: { width: "100%", height: 140, backgroundColor: "#d1d5db" },
  changeCoverBtn: {
    position: "absolute",
    bottom: 10,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeCoverText: { color: "white", fontSize: 12, fontWeight: "600" },

  // Avatar
  avatarSection: { paddingHorizontal: 16, marginTop: -36 },
  avatarWrapper: { position: "relative", width: 72, height: 72 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#fff" },
  avatarFallback: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "700", color: "#374151" },
  cameraOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: RED,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Fields
  fields: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  inputMultiline: { height: 80, paddingTop: 10 },

  // Save button
  saveButton: {
    margin: 16,
    marginTop: 24,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "white", fontSize: 15, fontWeight: "700" },

  // Section card
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: RED,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 16 },

  // Toggle row
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  toggleSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "#e5e7eb", padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: RED },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
  toggleThumbOn: { alignSelf: "flex-end" },

  // Social links
  socialRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  socialEmoji: { fontSize: 22, width: 32, textAlign: "center" },
  socialInfo: { flex: 1 },
  socialLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  socialInput: { fontSize: 13, color: RED, marginTop: 2, fontWeight: "500" },

  scroll: { paddingBottom: 40 },
});

function ToggleRow({
  label, sub, value, onChange,
}: {
  label: string; sub: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.7}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}
