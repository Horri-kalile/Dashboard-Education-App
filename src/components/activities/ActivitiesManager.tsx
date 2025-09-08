"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase-config";
import { cn } from "@/lib/utils";

// Simple utility components (could be swapped with shadcn components later)
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 placeholder-neutral-400",
        props.className
      )}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 placeholder-neutral-400 min-h-[100px] resize-y",
        props.className
      )}
    />
  );
}

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"] & {
  assets?: Database["public"]["Tables"]["assets"]["Row"][];
};

const BUCKET = "assets"; // ensure bucket exists in Supabase

export function ActivitiesManager({ userId }: { userId: string }) {
  const supabase = createClient();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [algorithmCorrection, setAlgorithmCorrection] = useState("");
  const [codeCorrection, setCodeCorrection] = useState("");
  // Dynamic taxonomy
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [levels, setLevels] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setAlgorithmCorrection("");
    setCodeCorrection("");
    setFiles([]);
    setUploadProgress({});
    setSelectedCategory("");
    setSelectedLevel("");
  };

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activities")
      .select("*, assets(*)")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setActivities((data as ActivityRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Load categories & levels once
  useEffect(() => {
    (async () => {
      const [
        { data: catData, error: catErr },
        { data: lvlData, error: lvlErr },
      ] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("levels").select("id, name").order("name"),
      ]);
      if (catErr) console.error("Categories load error", catErr);
      if (lvlErr) console.error("Levels load error", lvlErr);
      if (catData) setCategories(catData as { id: string; name: string }[]);
      if (lvlData) setLevels(lvlData as { id: string; name: string }[]);
    })();
  }, [supabase]);

  const onDropFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type.startsWith("image/") ||
        f.type.includes("pdf")
    );
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !description.trim() || !content.trim()) {
      setError("Title, Description and HTML Content are required.");
      return;
    }
    if (!selectedCategory || !selectedLevel) {
      setError("Category and Level are required.");
      return;
    }
    setSaving(true);
    try {
      // Build payload dynamically to avoid referencing columns that might not yet exist in DB
      type ActivitiesInsert =
        Database["public"]["Tables"]["activities"]["Insert"];
      const basePayload: ActivitiesInsert = {
        title: title.trim(),
        description: description.trim(),
        content,
        created_by: userId,
        is_published: true, // Auto-publish so it appears in mobile app
        category_id: selectedCategory,
        level_id: selectedLevel,
      };
      if (algorithmCorrection.trim())
        basePayload.algorithm_correction = algorithmCorrection;
      if (codeCorrection.trim()) basePayload.code_correction = codeCorrection;

      const { data: activity, error: insertError } = await supabase
        .from("activities")
        .insert(basePayload)
        .select()
        .single();
      if (insertError || !activity)
        throw insertError || new Error("Insert failed");

      // Upload assets sequentially (can optimize later)
      const uploadedAssets: Database["public"]["Tables"]["assets"]["Insert"][] =
        [];
      for (const file of files) {
        const path = `${activity.id}/${Date.now()}-${file.name}`;
        // Supabase JS lacks per-chunk progress in simple upload; we simulate quick progress
        setUploadProgress((p) => ({ ...p, [file.name]: 10 }));
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        setUploadProgress((p) => ({ ...p, [file.name]: 100 }));
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploadedAssets.push({
          activity_id: activity.id,
          name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: pub.publicUrl,
        });
      }
      if (uploadedAssets.length) {
        const { error: assetsErr } = await supabase
          .from("assets")
          .insert(uploadedAssets);
        if (assetsErr) throw assetsErr;
      }
      setSuccess("Activity created successfully");
      resetForm();
      setOpen(false);
      fetchActivities();
    } catch (err: unknown) {
      // Enhanced error logging for Supabase/Postgrest errors
      try {
        console.group("Activity create error");
        console.error("Raw error:", err);
        if (typeof err === "object" && err) {
          const anyErr = err as Record<string, unknown>;
          if ("message" in anyErr) console.error("message:", anyErr.message);
          if ("code" in anyErr) console.error("code:", anyErr.code);
          if ("details" in anyErr) console.error("details:", anyErr.details);
          if ("hint" in anyErr) console.error("hint:", anyErr.hint);
        }
        console.groupEnd();
      } catch {}
      function getMessage(e: unknown): string {
        if (typeof e === "string") return e;
        if (e && typeof e === "object" && "message" in e) {
          const m = (e as { message?: unknown }).message;
          if (typeof m === "string") return m;
        }
        return "Unexpected error";
      }
      setError(getMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Activities</h2>
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white text-sm font-medium px-4 py-2 shadow hover:bg-indigo-600/90 active:scale-[.98] transition"
        >
          <span className="inline-block">Nouvelle activité</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-indigo-100 dark:border-neutral-800 overflow-hidden bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500 dark:text-neutral-400 border-b border-indigo-100/70 dark:border-neutral-800 bg-indigo-50/40 dark:bg-neutral-800/40">
            <tr>
              <th className="py-2 px-4 font-medium">Title</th>
              <th className="py-2 px-4 font-medium">Description</th>
              <th className="py-2 px-4 font-medium">Created</th>
              <th className="py-2 px-4 font-medium">Files</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-400">
                  Loading...
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-400">
                  No activities yet.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-indigo-100/60 dark:border-neutral-800 hover:bg-indigo-50/30 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="py-2 px-4 font-medium text-neutral-800 dark:text-neutral-100">
                    {a.title}
                  </td>
                  <td className="py-2 px-4 max-w-xs truncate text-neutral-600 dark:text-neutral-400">
                    {a.description}
                  </td>
                  <td className="py-2 px-4 text-neutral-500 dark:text-neutral-400 text-xs">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                    {a.assets?.length || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
          <div
            className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
            onClick={() => !saving && setOpen(false)}
          />
          <div className="relative w-full max-w-4xl rounded-xl border border-indigo-100 dark:border-neutral-800 shadow-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur p-6 overflow-y-auto max-h-[80vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Nouvelle activité
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Create a new learning activity
                </p>
              </div>
              <button
                onClick={() => !saving && setOpen(false)}
                className="rounded-md p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md border border-rose-300/50 bg-rose-50/70 text-rose-700 text-xs px-3 py-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-emerald-300/50 bg-emerald-50/70 text-emerald-700 text-xs px-3 py-2">
                  {success}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Activity title"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    Description *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Short description"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    HTML Content *
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="<h2>Intro</h2><p>Explain the concept...</p>"
                    className="min-h-[160px] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    Algorithm Correction
                  </label>
                  <Textarea
                    value={algorithmCorrection}
                    onChange={(e) => setAlgorithmCorrection(e.target.value)}
                    placeholder="Explain algorithmic thinking..."
                    className="min-h-[120px] font-mono"
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Category *
                    </label>
                    <select
                      required
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        {categories.length ? "Select category" : "Loading..."}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    Code Correction
                  </label>
                  <Textarea
                    value={codeCorrection}
                    onChange={(e) => setCodeCorrection(e.target.value)}
                    placeholder="Show code solution..."
                    className="min-h-[120px] font-mono"
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Level *
                    </label>
                    <select
                      required
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        {levels.length ? "Select level" : "Loading..."}
                      </option>
                      {levels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                  Files (PDF, images)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDropFiles(e.dataTransfer.files);
                  }}
                  className="relative border-2 border-dashed rounded-lg p-6 text-center border-indigo-300/60 dark:border-neutral-700 bg-indigo-50/40 dark:bg-neutral-800/40 hover:border-indigo-400 transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    onChange={(e) => onDropFiles(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Drag & drop files here or click to select
                  </p>
                </div>
                {files.length > 0 && (
                  <ul className="space-y-1 text-xs max-h-40 overflow-y-auto">
                    {files.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-center justify-between rounded bg-white/70 dark:bg-neutral-800/70 px-2 py-1"
                      >
                        <span className="truncate max-w-[70%]" title={f.name}>
                          {f.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {uploadProgress[f.name] != null && (
                            <span className="text-[10px] text-neutral-500">
                              {uploadProgress[f.name]}%
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(f.name)}
                            className="text-rose-500 hover:text-rose-600"
                            aria-label="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 shadow hover:bg-indigo-600/90 active:scale-[.97] disabled:opacity-60"
                >
                  {saving && <Spinner />}
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
