"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Search, Pencil, Trash2, X, Upload, Cpu, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORIES = ["smartphone", "laptop", "tablet", "wearable", "audio", "other"];

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  isTrending: boolean;
  avgScore: number;
  reviewCount: number;
}

interface FormState {
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = { name: "", brand: "", category: "smartphone", imageUrl: "" };

export default function AdminGadgetsPage() {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Gadget | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Gadget | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchGadgets = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/gadgets?search=${encodeURIComponent(q)}`);
      setGadgets(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGadgets(); }, [fetchGadgets]);

  useEffect(() => {
    const t = setTimeout(() => fetchGadgets(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchGadgets]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setModal("add"); };
  const openEdit = (g: Gadget) => {
    setEditing(g);
    setForm({ name: g.name, brand: g.brand, category: g.category, imageUrl: g.imageUrl ?? "" });
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditing(null); setForm(EMPTY_FORM); };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(f => ({ ...f, imageUrl: res.data.url }));
    } catch {
      alert("Gagal upload foto");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.brand.trim()) { alert("Nama dan brand wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), brand: form.brand.trim(), category: form.category, imageUrl: form.imageUrl || undefined };
      if (modal === "add") {
        const res = await api.post("/admin/gadgets", payload);
        setGadgets(prev => [res.data, ...prev]);
      } else if (editing) {
        const res = await api.patch(`/admin/gadgets/${editing.id}`, payload);
        setGadgets(prev => prev.map(g => g.id === editing.id ? { ...g, ...res.data } : g));
      }
      closeModal();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Gagal menyimpan gadget");
    } finally {
      setSaving(false);
    }
  };

  const deleteGadget = async (g: Gadget) => {
    try {
      await api.delete(`/admin/gadgets/${g.id}`);
      setGadgets(prev => prev.filter(x => x.id !== g.id));
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Gagal menghapus gadget");
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu size={22} /> Kelola Gadget
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Tambah, edit, dan hapus data gadget beserta foto produk.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-xl hover:bg-foreground/90 transition-colors">
          <Plus size={16} /> Tambah Gadget
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau brand..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-xl bg-background outline-none focus:border-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gadget</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trending</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : gadgets.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Tidak ada gadget ditemukan</td></tr>
            ) : gadgets.map(g => (
              <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {g.imageUrl
                        ? <img src={g.imageUrl} alt={g.name} className="w-full h-full object-contain" />
                        : <span className="text-lg">📱</span>}
                    </div>
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">{g.category}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.avgScore.toFixed(1)} ({g.reviewCount})</td>
                <td className="px-4 py-3">
                  {g.isTrending && <span className="text-xs bg-red-50 text-[#d42b2b] border border-red-200 px-2 py-1 rounded-full font-semibold">🔥 Trending</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(g)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{modal === "add" ? "Tambah Gadget" : "Edit Gadget"}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-muted rounded-lg"><X size={18} /></button>
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Foto Produk</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative border-2 border-dashed border-border rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-colors overflow-hidden"
              >
                {form.imageUrl ? (
                  <>
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-semibold">Ganti Foto</p>
                    </div>
                  </>
                ) : uploading ? (
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload size={24} className="text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Klik untuk upload foto</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Nama Produk *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="cth: iPhone 17 Pro Max" className="w-full px-3 py-2 text-sm border border-input rounded-xl outline-none focus:border-foreground bg-background" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Brand *</label>
                <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="cth: Apple" className="w-full px-3 py-2 text-sm border border-input rounded-xl outline-none focus:border-foreground bg-background" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Kategori *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-input rounded-xl outline-none focus:border-foreground bg-background capitalize">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm border border-input rounded-xl hover:bg-muted transition-colors">Batal</button>
              <button onClick={save} disabled={saving || uploading} className="flex-1 px-4 py-2 text-sm bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {modal === "add" ? "Simpan" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Hapus Gadget?</h2>
            <p className="text-sm text-muted-foreground">
              <strong>{deleteConfirm.brand} {deleteConfirm.name}</strong> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm border border-input rounded-xl hover:bg-muted transition-colors">Batal</button>
              <button onClick={() => deleteGadget(deleteConfirm)} className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
