import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Reviews & your projects – tabuľky a pravidlá: supabase/reviews.sql
// Typy tabuliek vzniknú až po `supabase gen types`; dovtedy uvoľnený klient.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const PRODUCT = "alter";
export const VIDEO_BUCKET = "review-videos";
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const VIDEO_MAX_SECONDS = 10;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export type Review = {
  id: string;
  user_id: string;
  author_name: string;
  author_plan: string | null;
  rating: number;
  body: string;
  youtube_url: string | null;
  project_url: string | null;
  video_path: string | null;
  likes_count: number;
  comments_count: number;
  edited: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewComment = {
  id: string;
  review_id: string;
  user_id: string;
  author_name: string;
  body: string;
  edited: boolean;
  created_at: string;
};

export type ReviewInput = {
  rating: number;
  body: string;
  youtube_url: string | null;
  project_url: string | null;
  video_path: string | null;
};

export const videoPublicUrl = (path: string) =>
  supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;

// ---- zoznam recenzií --------------------------------------------------------
export function useReviews() {
  return useQuery({
    queryKey: ["reviews", PRODUCT],
    enabled: supabaseConfigured,
    retry: 1,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await db
        .from("reviews")
        .select("*")
        .eq("product", PRODUCT)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

// ---- smie prihlásený písať recenziu? (má licenciu) ---------------------------
export function useCanReview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can_review", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await db.rpc("can_review", { p_user: user!.id });
      if (error) return false;
      return Boolean(data);
    },
  });
}

// ---- ktoré recenzie som lajkol ----------------------------------------------
export function useMyLikes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["review_likes", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await db.from("review_likes").select("review_id").eq("user_id", user!.id);
      if (error) return new Set();
      return new Set((data ?? []).map((r: { review_id: string }) => r.review_id));
    },
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, liked }: { reviewId: string; liked: boolean }) => {
      if (!user) throw new Error("not_signed_in");
      const q = liked
        ? db.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", user.id)
        : db.from("review_likes").insert({ review_id: reviewId, user_id: user.id });
      const { error } = await q;
      if (error) throw error;
    },
    // okamžitá odozva v UI, potom sa dorovná zo servera
    onMutate: async ({ reviewId, liked }) => {
      qc.setQueryData<Set<string>>(["review_likes", user?.id], (old) => {
        const next = new Set(old ?? []);
        if (liked) next.delete(reviewId);
        else next.add(reviewId);
        return next;
      });
      qc.setQueryData<Review[]>(["reviews", PRODUCT], (old) =>
        old?.map((r) => (r.id === reviewId ? { ...r, likes_count: r.likes_count + (liked ? -1 : 1) } : r)),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["review_likes", user?.id] });
      qc.invalidateQueries({ queryKey: ["reviews", PRODUCT] });
    },
  });
}

// ---- nahratie krátkeho videa --------------------------------------------------
/** Zistí dĺžku videa v prehliadači (Supabase to na serveri nevie). */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable_video"));
    };
    v.src = url;
  });
}

export async function uploadReviewVideo(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  return path;
}

export async function removeReviewVideo(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(VIDEO_BUCKET).remove([path]);
}

// ---- vytvorenie / úprava / zmazanie recenzie -----------------------------------
export function useSaveReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ReviewInput }) => {
      if (!user) throw new Error("not_signed_in");
      const { error } = id
        ? await db.from("reviews").update(input).eq("id", id)
        : await db.from("reviews").insert({ ...input, product: PRODUCT, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", PRODUCT] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: Review) => {
      const { error } = await db.from("reviews").delete().eq("id", review.id);
      if (error) throw error;
      await removeReviewVideo(review.video_path);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", PRODUCT] }),
  });
}

// ---- komentáre --------------------------------------------------------------
export function useComments(reviewId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["review_comments", reviewId],
    enabled: enabled && supabaseConfigured,
    queryFn: async (): Promise<ReviewComment[]> => {
      const { data, error } = await db
        .from("review_comments")
        .select("id, review_id, user_id, author_name, body, edited, created_at")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReviewComment[];
    },
  });
}

function useCommentInvalidate() {
  const qc = useQueryClient();
  return (reviewId: string) => {
    qc.invalidateQueries({ queryKey: ["review_comments", reviewId] });
    qc.invalidateQueries({ queryKey: ["reviews", PRODUCT] });
  };
}

export function useAddComment() {
  const { user } = useAuth();
  const invalidate = useCommentInvalidate();
  return useMutation({
    mutationFn: async ({ reviewId, body }: { reviewId: string; body: string }) => {
      if (!user) throw new Error("not_signed_in");
      const { error } = await db
        .from("review_comments")
        .insert({ review_id: reviewId, user_id: user.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.reviewId),
  });
}

export function useEditComment() {
  const invalidate = useCommentInvalidate();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; reviewId: string; body: string }) => {
      const { error } = await db.from("review_comments").update({ body: body.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.reviewId),
  });
}

export function useDeleteComment() {
  const invalidate = useCommentInvalidate();
  return useMutation({
    mutationFn: async ({ id }: { id: string; reviewId: string }) => {
      const { error } = await db.from("review_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.reviewId),
  });
}

// ---- pomôcky ------------------------------------------------------------------
/** Vytiahne ID videa z bežných YouTube odkazov (watch, youtu.be, shorts, embed, live). */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\.|^music\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
        if (m) id = m[2];
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function normalizeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}
