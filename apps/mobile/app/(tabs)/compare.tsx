import { useState, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, Sparkles } from "lucide-react-native";
import { api } from "../../src/lib/api";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
}

interface CompareResult {
  id: string;
  status: string;
  summary: string | null;
  recommendation: string | null;
  scores: Record<string, Record<string, number>>;
  gadgetIds: string[];
}

export default function CompareScreen() {
  const [selected, setSelected] = useState<Gadget[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Gadget[]>([]);
  const [budget, setBudget] = useState("");
  const [usecase, setUsecase] = useState("");
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await api.get(`/gadgets?search=${encodeURIComponent(q)}&limit=8`);
      setResults(res.data.data ?? res.data);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const addGadget = (g: Gadget) => {
    if (selected.length >= 3 || selected.find((s) => s.id === g.id)) return;
    setSelected((prev) => [...prev, g]);
    setSearch("");
    setResults([]);
  };

  const removeGadget = (id: string) => setSelected((prev) => prev.filter((g) => g.id !== id));

  const startCompare = async () => {
    if (selected.length < 2) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const res = await api.post("/ai/compare", {
        gadgetIds: selected.map((g) => g.id),
        userBudget: budget ? parseInt(budget) : undefined,
        userUsecase: usecase || undefined,
      });
      const compId = res.data.id;
      let done = false;
      let attempts = 0;
      while (!done && attempts < 45) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await api.get(`/ai/compare/${compId}`);
        if (poll.data.status === "done" || poll.data.status === "failed") {
          setCompareResult(poll.data);
          done = true;
        }
        attempts++;
      }
    } catch {
      setCompareResult({ id: "", status: "failed", summary: null, recommendation: null, scores: {}, gadgetIds: [] });
    } finally {
      setComparing(false);
    }
  };

  const scoreCategories = compareResult?.scores
    ? Object.keys(Object.values(compareResult.scores)[0] ?? {})
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Compare</Text>
          <Sparkles size={18} color="#f59e0b" />
        </View>

        <View style={styles.body}>
          {/* Selected */}
          <Text style={styles.label}>Pilih 2–3 gadget untuk dibandingkan</Text>
          <View style={styles.chips}>
            {selected.map((g) => (
              <View key={g.id} style={styles.chip}>
                <Text style={styles.chipText}>{g.brand} {g.name}</Text>
                <TouchableOpacity onPress={() => removeGadget(g.id)}>
                  <X size={12} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
            {selected.length < 3 && (
              <Text style={styles.slotText}>+ {3 - selected.length} lagi</Text>
            )}
          </View>

          {/* Search */}
          {selected.length < 3 && (
            <View style={styles.searchWrap}>
              <View style={styles.searchBox}>
                <Search size={14} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari gadget..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              {results.filter((r) => !selected.find((s) => s.id === r.id)).length > 0 && (
                <View style={styles.dropdown}>
                  {results
                    .filter((r) => !selected.find((s) => s.id === r.id))
                    .map((g) => (
                      <TouchableOpacity key={g.id} style={styles.dropItem} onPress={() => addGadget(g)}>
                        <Text style={styles.dropName}>{g.brand} {g.name}</Text>
                        <Text style={styles.dropCat}>{g.category}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          )}

          {/* Context */}
          <Text style={styles.sectionTitle}>Konteks (opsional)</Text>
          <Text style={styles.inputLabel}>Budget (Rp)</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: 8000000"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
          <Text style={styles.inputLabel}>Kegunaan utama</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: gaming, foto, kerja"
            placeholderTextColor="#9ca3af"
            value={usecase}
            onChangeText={setUsecase}
          />

          {/* Button */}
          <TouchableOpacity
            style={[styles.btn, (selected.length < 2 || comparing) && styles.btnDisabled]}
            onPress={startCompare}
            disabled={selected.length < 2 || comparing}
          >
            <Sparkles size={16} color="#fff" />
            <Text style={styles.btnText}>{comparing ? "AI sedang menganalisis..." : "Bandingkan dengan AI"}</Text>
          </TouchableOpacity>

          {comparing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#111" />
              <Text style={styles.loadingText}>Biasanya 20–40 detik</Text>
            </View>
          )}

          {/* Results */}
          {compareResult?.status === "done" && (
            <View style={styles.results}>
              <Text style={styles.sectionTitle}>Hasil Perbandingan AI</Text>

              {/* Score table */}
              {scoreCategories.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, styles.tableCellLabel]}>Kategori</Text>
                    {selected.map((g) => (
                      <Text key={g.id} style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={1}>{g.name}</Text>
                    ))}
                  </View>
                  {scoreCategories.map((cat) => (
                    <View key={cat} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellLabel, { color: "#6b7280" }]}>{cat}</Text>
                      {selected.map((g) => {
                        const score = compareResult.scores[g.id]?.[cat] ?? 0;
                        const best = Math.max(...selected.map((s) => compareResult.scores[s.id]?.[cat] ?? 0));
                        return (
                          <Text key={g.id} style={[styles.tableCell, styles.scoreText, score === best && styles.scoreBest]}>
                            {score}/10
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}

              {compareResult.recommendation && (
                <View style={styles.recBox}>
                  <Text style={styles.recTitle}>Rekomendasi AI</Text>
                  <Text style={styles.recText}>{compareResult.recommendation}</Text>
                </View>
              )}

              {compareResult.summary && (
                <View style={styles.summaryBox}>
                  <Text style={styles.sectionTitle}>Ringkasan</Text>
                  <Text style={styles.summaryText}>{compareResult.summary}</Text>
                </View>
              )}
            </View>
          )}

          {compareResult?.status === "failed" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Perbandingan gagal. Coba lagi beberapa saat.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 18, fontWeight: "700" },
  body: { padding: 16, gap: 12 },
  label: { fontSize: 12, color: "#6b7280" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: "500" },
  slotText: { fontSize: 12, color: "#9ca3af", paddingVertical: 6 },
  searchWrap: { gap: 4 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  dropdown: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  dropItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropName: { fontSize: 13, fontWeight: "500" },
  dropCat: { fontSize: 11, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  inputLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111", marginBottom: 8 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111", borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loadingBox: { alignItems: "center", gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 12, color: "#9ca3af" },
  results: { gap: 12, marginTop: 8 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 8 },
  tableHeaderText: { fontWeight: "600", fontSize: 11 },
  tableRow: { flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  tableCell: { flex: 1, textAlign: "center", fontSize: 11, paddingHorizontal: 4 },
  tableCellLabel: { textAlign: "left", paddingLeft: 10, color: "#374151" },
  scoreText: { fontWeight: "600" },
  scoreBest: { color: "#16a34a" },
  recBox: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 12, padding: 14 },
  recTitle: { fontSize: 12, fontWeight: "700", color: "#92400e", marginBottom: 4 },
  recText: { fontSize: 13, color: "#78350f", lineHeight: 20 },
  summaryBox: { gap: 6 },
  summaryText: { fontSize: 13, color: "#6b7280", lineHeight: 20 },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 14 },
  errorText: { fontSize: 13, color: "#dc2626" },
});
