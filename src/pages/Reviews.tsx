import { useMemo, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  ExternalLink,
  Film,
  Heart,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Play,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
  X,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  VIDEO_MAX_BYTES,
  VIDEO_MAX_SECONDS,
  VIDEO_TYPES,
  normalizeUrl,
  readVideoDuration,
  removeReviewVideo,
  uploadReviewVideo,
  useAddComment,
  useCanReview,
  useComments,
  useDeleteComment,
  useDeleteReview,
  useEditComment,
  useMyLikes,
  useReviews,
  useSaveReview,
  useToggleLike,
  videoPublicUrl,
  youtubeId,
  type Review,
  type ReviewComment,
} from "@/hooks/useReviews";

/* ------------------------------------------------------------------ */
/* Texty (EN základ, SK preklad) – všetko na jednom mieste              */
/* ------------------------------------------------------------------ */
const TEXT = {
  en: {
    title: "Reviews & your projects",
    subtitle: "What producers think about Alter — and what they made with it.",
    reviews: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    noReviews: "No reviews yet. Be the first one.",
    write: "Write a review",
    signInToJoin: "Sign in to comment and like",
    signIn: "Sign in",
    onlyOwners: "Reviews can be written by license owners. You can still like and reply.",
    yourReview: "Your review",
    sortNewest: "Newest",
    sortTop: "Top rated",
    sortLiked: "Most liked",
    projectsOnly: "With projects",
    ratingLabel: "Your rating",
    bodyPlaceholder: "How do you use Alter? What do you like, what's missing?",
    addProject: "Show your project (optional)",
    none: "None",
    youtube: "YouTube",
    clip: "Short clip",
    ytPlaceholder: "https://youtube.com/watch?v=…",
    clipHint: `MP4 / WebM, max ${VIDEO_MAX_SECONDS} s, max ${VIDEO_MAX_BYTES / 1024 / 1024} MB`,
    chooseClip: "Choose clip",
    replaceClip: "Replace",
    linkLabel: "Link to your project (optional)",
    linkPlaceholder: "Spotify, SoundCloud, Instagram, your website…",
    publish: "Publish",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    del: "Delete",
    confirmDel: "Delete?",
    yes: "Yes",
    no: "No",
    edited: "edited",
    reply: "Reply",
    replyPlaceholder: "Write a reply…",
    send: "Send",
    signInToReply: "Sign in to reply",
    owner: (plan: string) => `${plan[0].toUpperCase()}${plan.slice(1)} owner`,
    adminDelete: "Remove (admin)",
    openLink: "Open project",
    errRating: "Pick a rating (1–5 stars).",
    errBody: "Write at least a few words.",
    errYt: "That doesn't look like a YouTube link.",
    errLink: "That link doesn't look valid.",
    errClipType: "Only MP4, WebM or MOV clips.",
    errClipSize: `Clip is too big (max ${VIDEO_MAX_BYTES / 1024 / 1024} MB).`,
    errClipLong: `Clip is too long (max ${VIDEO_MAX_SECONDS} s). Use a YouTube link or project link for longer videos.`,
    errClipRead: "Couldn't read this video file.",
    errGeneric: "Something went wrong. Please try again.",
    errSpam: "Slow down a bit — too many comments in the last hour.",
    saved: "Review published. Thanks!",
    updated: "Review updated.",
    deleted: "Deleted.",
    uploading: "Uploading clip…",
  },
  sk: {
    title: "Recenzie a vaše projekty",
    subtitle: "Čo si producenti myslia o Alteri — a čo s ním vytvorili.",
    reviews: (n: number) => (n === 1 ? "1 recenzia" : n >= 2 && n <= 4 ? `${n} recenzie` : `${n} recenzií`),
    noReviews: "Zatiaľ žiadne recenzie. Buď prvý.",
    write: "Napísať recenziu",
    signInToJoin: "Prihlás sa a môžeš komentovať a lajkovať",
    signIn: "Prihlásiť sa",
    onlyOwners: "Recenzie môžu písať majitelia licencie. Lajkovať a odpovedať môžeš aj tak.",
    yourReview: "Tvoja recenzia",
    sortNewest: "Najnovšie",
    sortTop: "Najlepšie",
    sortLiked: "Najobľúbenejšie",
    projectsOnly: "S projektom",
    ratingLabel: "Tvoje hodnotenie",
    bodyPlaceholder: "Ako používaš Alter? Čo sa ti páči, čo chýba?",
    addProject: "Ukáž svoj projekt (nepovinné)",
    none: "Nič",
    youtube: "YouTube",
    clip: "Krátke video",
    ytPlaceholder: "https://youtube.com/watch?v=…",
    clipHint: `MP4 / WebM, max ${VIDEO_MAX_SECONDS} s, max ${VIDEO_MAX_BYTES / 1024 / 1024} MB`,
    chooseClip: "Vybrať video",
    replaceClip: "Vymeniť",
    linkLabel: "Odkaz na tvoj projekt (nepovinné)",
    linkPlaceholder: "Spotify, SoundCloud, Instagram, tvoj web…",
    publish: "Zverejniť",
    save: "Uložiť",
    cancel: "Zrušiť",
    edit: "Upraviť",
    del: "Zmazať",
    confirmDel: "Zmazať?",
    yes: "Áno",
    no: "Nie",
    edited: "upravené",
    reply: "Odpovedať",
    replyPlaceholder: "Napíš odpoveď…",
    send: "Odoslať",
    signInToReply: "Prihlás sa a odpovedz",
    owner: (plan: string) => `Majiteľ ${plan[0].toUpperCase()}${plan.slice(1)}`,
    adminDelete: "Odstrániť (admin)",
    openLink: "Otvoriť projekt",
    errRating: "Vyber hodnotenie (1–5 hviezdičiek).",
    errBody: "Napíš aspoň pár slov.",
    errYt: "Toto nevyzerá ako YouTube odkaz.",
    errLink: "Odkaz nevyzerá platne.",
    errClipType: "Len MP4, WebM alebo MOV videá.",
    errClipSize: `Video je príliš veľké (max ${VIDEO_MAX_BYTES / 1024 / 1024} MB).`,
    errClipLong: `Video je príliš dlhé (max ${VIDEO_MAX_SECONDS} s). Na dlhšie použi YouTube alebo odkaz.`,
    errClipRead: "Tento video súbor sa nedá prečítať.",
    errGeneric: "Niečo sa pokazilo. Skús to znova.",
    errSpam: "Spomaľ — priveľa komentárov za poslednú hodinu.",
    saved: "Recenzia zverejnená. Ďakujem!",
    updated: "Recenzia upravená.",
    deleted: "Zmazané.",
    uploading: "Nahrávam video…",
  },
};
type Txt = (typeof TEXT)["en"];

const useTxt = (): Txt => {
  const { lang } = useT();
  return (TEXT[lang] ?? TEXT.en) as Txt;
};

const errText = (tx: Txt, err: unknown) => {
  const msg = (err as { message?: string })?.message ?? "";
  if (msg.includes("too_many_comments")) return tx.errSpam;
  return tx.errGeneric;
};

function timeAgo(iso: string, lang: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let v = diff;
  for (const [size, unit] of steps) {
    if (Math.abs(v) < size) return rtf.format(Math.round(v), unit);
    v /= size;
  }
  return "";
}

/* ------------------------------------------------------------------ */
/* Malé stavebné kúsky                                                  */
/* ------------------------------------------------------------------ */
const Stars = ({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = Math.max(0, Math.min(1, value - (i - 1)));
      return (
        <span key={i} className={cn("relative inline-block", size === "lg" ? "h-5 w-5" : "h-4 w-4")}>
          <Star className="absolute inset-0 h-full w-full text-muted-foreground/40" />
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
            <Star className={cn("h-full fill-amber-400 text-amber-400", size === "lg" ? "w-5" : "w-4")} />
          </span>
        </span>
      );
    })}
  </span>
);

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              i <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
};

const Avatar = ({ name }: { name: string }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-sm font-semibold text-primary">
    {(name.trim()[0] ?? "?").toUpperCase()}
  </span>
);

/** Tlačidlo "Zmazať", ktoré sa najprv opýta priamo na mieste (bez vyskakovacích okien). */
const ConfirmDelete = ({
  onConfirm,
  label,
  busy,
  admin = false,
}: {
  onConfirm: () => void;
  label: string;
  busy?: boolean;
  admin?: boolean;
}) => {
  const tx = useTxt();
  const [ask, setAsk] = useState(false);
  if (ask)
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{tx.confirmDel}</span>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="font-semibold text-red-400 hover:underline disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tx.yes}
        </button>
        <button type="button" onClick={() => setAsk(false)} className="text-muted-foreground hover:text-foreground">
          {tx.no}
        </button>
      </span>
    );
  return (
    <ActionBtn onClick={() => setAsk(true)} className={admin ? "text-red-400/80 hover:text-red-400" : undefined}>
      {admin ? <ShieldAlert className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
      {label}
    </ActionBtn>
  );
};

const ActionBtn = ({
  children,
  onClick,
  active,
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50",
      active && "text-foreground",
      className,
    )}
  >
    {children}
  </button>
);

const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full resize-y rounded-md border border-input bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      props.className,
    )}
  />
);

/* ------------------------------------------------------------------ */
/* Médiá pri recenzii                                                   */
/* ------------------------------------------------------------------ */
/** YouTube sa načíta až po kliknutí – rýchlejšia stránka, žiadne cookies vopred. */
const YouTubeLite = ({ id }: { id: string }) => {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 bg-black">
      {play ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0" aria-label="Play">
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 ring-1 ring-white/30 transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 fill-white text-white" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
};

const ReviewMedia = ({ review }: { review: Review }) => {
  const tx = useTxt();
  const yt = youtubeId(review.youtube_url);
  if (!yt && !review.video_path && !review.project_url) return null;
  let host = "";
  try {
    host = review.project_url ? new URL(review.project_url).hostname.replace(/^www\./, "") : "";
  } catch {
    host = review.project_url ?? "";
  }
  return (
    <div className="mt-4 space-y-3">
      {yt && <YouTubeLite id={yt} />}
      {!yt && review.video_path && (
        <video
          src={videoPublicUrl(review.video_path)}
          controls
          playsInline
          loop
          preload="metadata"
          className="max-h-[420px] w-full rounded-lg border border-border/50 bg-black"
        />
      )}
      {review.project_url && (
        <a
          href={review.project_url}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon transition-colors hover:bg-neon/20"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {tx.openLink} · {host}
          </span>
        </a>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Formulár recenzie (nová aj úprava)                                   */
/* ------------------------------------------------------------------ */
type MediaMode = "none" | "youtube" | "clip";

const ReviewForm = ({ existing, onDone }: { existing?: Review; onDone: () => void }) => {
  const tx = useTxt();
  const { user } = useAuth();
  const save = useSaveReview();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [mode, setMode] = useState<MediaMode>(
    existing?.youtube_url ? "youtube" : existing?.video_path ? "clip" : "none",
  );
  const [yt, setYt] = useState(existing?.youtube_url ?? "");
  const [link, setLink] = useState(existing?.project_url ?? "");
  const [clip, setClip] = useState<File | null>(null);
  const [clipError, setClipError] = useState("");
  const [busy, setBusy] = useState(false);

  const pickClip = async (file: File | undefined) => {
    setClipError("");
    setClip(null);
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) return setClipError(tx.errClipType);
    if (file.size > VIDEO_MAX_BYTES) return setClipError(tx.errClipSize);
    try {
      const d = await readVideoDuration(file);
      if (!isFinite(d) || d > VIDEO_MAX_SECONDS + 0.5) return setClipError(tx.errClipLong);
    } catch {
      return setClipError(tx.errClipRead);
    }
    setClip(file);
  };

  const submit = async () => {
    if (!user) return;
    if (rating < 1) return toast.error(tx.errRating);
    if (body.trim().length < 3) return toast.error(tx.errBody);

    let youtube_url: string | null = null;
    if (mode === "youtube") {
      const id = youtubeId(normalizeUrl(yt) ?? "");
      if (!id) return toast.error(tx.errYt);
      youtube_url = `https://www.youtube.com/watch?v=${id}`;
    }
    let project_url: string | null = null;
    if (link.trim()) {
      project_url = normalizeUrl(link);
      if (!project_url) return toast.error(tx.errLink);
    }
    if (mode === "clip" && !clip && !existing?.video_path) return toast.error(tx.chooseClip);

    setBusy(true);
    let newPath: string | null = null;
    try {
      let video_path: string | null = mode === "clip" ? existing?.video_path ?? null : null;
      if (mode === "clip" && clip) {
        toast.message(tx.uploading);
        newPath = await uploadReviewVideo(user.id, clip);
        video_path = newPath;
      }
      await save.mutateAsync({
        id: existing?.id,
        input: { rating, body: body.trim(), youtube_url, project_url, video_path },
      });
      // starý súbor už nepotrebujeme
      if (existing?.video_path && existing.video_path !== video_path) {
        await removeReviewVideo(existing.video_path);
      }
      toast.success(existing ? tx.updated : tx.saved);
      onDone();
    } catch (e) {
      if (newPath) await removeReviewVideo(newPath);
      console.error("[reviews] save failed", e);
      toast.error(tx.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  const modes: { key: MediaMode; label: string; icon: ReactNode }[] = [
    { key: "none", label: tx.none, icon: null },
    { key: "youtube", label: tx.youtube, icon: <Youtube className="h-3.5 w-3.5" /> },
    { key: "clip", label: tx.clip, icon: <Film className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="rounded-xl border border-primary/40 bg-card/70 p-5 shadow-[0_0_30px_-15px_hsl(var(--primary))] backdrop-blur">
      <p className="text-sm font-medium text-muted-foreground">{tx.ratingLabel}</p>
      <div className="mt-1">
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <TextArea
        className="mt-4"
        rows={4}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={tx.bodyPlaceholder}
      />
      <p className="mt-1 text-right text-[11px] text-muted-foreground/70">{body.length} / 2000</p>

      <div className="mt-3 border-t border-border/40 pt-4">
        <p className="text-sm font-medium">{tx.addProject}</p>
        <div className="mt-2 inline-flex rounded-lg border border-border/60 bg-background/40 p-0.5">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {mode === "youtube" && (
          <Input className="mt-3" value={yt} onChange={(e) => setYt(e.target.value)} placeholder={tx.ytPlaceholder} />
        )}

        {mode === "clip" && (
          <div className="mt-3">
            <input
              ref={fileRef}
              type="file"
              accept={VIDEO_TYPES.join(",")}
              className="hidden"
              onChange={(e) => void pickClip(e.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload />
                {clip || existing?.video_path ? tx.replaceClip : tx.chooseClip}
              </Button>
              <span className="text-xs text-muted-foreground">
                {clip ? clip.name : existing?.video_path && !clipError ? "✓" : tx.clipHint}
              </span>
            </div>
            {clipError && <p className="mt-2 text-xs text-red-400">{clipError}</p>}
          </div>
        )}

        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {tx.linkLabel}
          </span>
          <Input
            className="mt-1.5"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={tx.linkPlaceholder}
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone} disabled={busy}>
          {tx.cancel}
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {existing ? tx.save : tx.publish}
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Komentáre (jedna úroveň – žiadne vnorené labyrinty)                  */
/* ------------------------------------------------------------------ */
const CommentRow = ({ c, isAdmin }: { c: ReviewComment; isAdmin: boolean }) => {
  const tx = useTxt();
  const { lang } = useT();
  const { user } = useAuth();
  const edit = useEditComment();
  const del = useDeleteComment();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);
  const mine = user?.id === c.user_id;

  const saveEdit = async () => {
    if (!text.trim()) return;
    try {
      await edit.mutateAsync({ id: c.id, reviewId: c.review_id, body: text });
      setEditing(false);
    } catch {
      toast.error(tx.errGeneric);
    }
  };

  return (
    <li className="flex gap-3">
      <Avatar name={c.author_name} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{c.author_name}</span> · {timeAgo(c.created_at, lang)}
          {c.edited && ` · ${tx.edited}`}
        </p>
        {editing ? (
          <div className="mt-1.5">
            <TextArea rows={2} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-1.5 flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={edit.isPending}>
                {tx.save}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setText(c.body);
                }}
              >
                {tx.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-line break-words text-sm">{c.body}</p>
        )}
        {!editing && (mine || isAdmin) && (
          <div className="-ml-2 mt-1 flex items-center gap-1">
            {mine && (
              <ActionBtn onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
                {tx.edit}
              </ActionBtn>
            )}
            <ConfirmDelete
              label={mine ? tx.del : tx.adminDelete}
              admin={!mine}
              busy={del.isPending}
              onConfirm={() =>
                del.mutate(
                  { id: c.id, reviewId: c.review_id },
                  { onSuccess: () => toast.success(tx.deleted), onError: () => toast.error(tx.errGeneric) },
                )
              }
            />
          </div>
        )}
      </div>
    </li>
  );
};

const Thread = ({ reviewId, isAdmin }: { reviewId: string; isAdmin: boolean }) => {
  const tx = useTxt();
  const { session } = useAuth();
  const { data: comments = [], isLoading } = useComments(reviewId, true);
  const add = useAddComment();
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    add.mutate(
      { reviewId, body: text },
      { onSuccess: () => setText(""), onError: (e) => toast.error(errText(tx, e)) },
    );
  };

  return (
    <div className="mt-4 border-t border-border/40 pt-4">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        comments.length > 0 && (
          <ul className="space-y-4">
            {comments.map((c) => (
              <CommentRow key={c.id} c={c} isAdmin={isAdmin} />
            ))}
          </ul>
        )
      )}

      {session ? (
        <div className={cn("flex items-end gap-2", comments.length > 0 && "mt-4")}>
          <TextArea
            rows={1}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={tx.replyPlaceholder}
            className="min-h-[40px]"
          />
          <Button size="sm" onClick={send} disabled={add.isPending || !text.trim()} className="h-10">
            {add.isPending ? <Loader2 className="animate-spin" /> : tx.send}
          </Button>
        </div>
      ) : (
        <Link
          to="/login"
          state={{ from: { pathname: "/alter/reviews" } }}
          className={cn("inline-block text-sm text-primary hover:underline", comments.length > 0 && "mt-4")}
        >
          {tx.signInToReply}
        </Link>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Karta recenzie                                                       */
/* ------------------------------------------------------------------ */
const ReviewCard = ({
  review,
  liked,
  isAdmin,
  highlight,
}: {
  review: Review;
  liked: boolean;
  isAdmin: boolean;
  highlight?: boolean;
}) => {
  const tx = useTxt();
  const { lang } = useT();
  const { user } = useAuth();
  const toggleLike = useToggleLike();
  const del = useDeleteReview();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = user?.id === review.user_id;

  if (editing) return <ReviewForm existing={review} onDone={() => setEditing(false)} />;

  const like = () => {
    if (!user) {
      toast.message(tx.signInToJoin);
      return;
    }
    toggleLike.mutate({ reviewId: review.id, liked }, { onError: () => toast.error(tx.errGeneric) });
  };

  return (
    <article
      className={cn(
        "rounded-xl border bg-card/60 p-5 backdrop-blur transition-colors",
        highlight ? "border-primary/50" : "border-border/50 hover:border-primary/30",
      )}
    >
      {highlight && (
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-primary">{tx.yourReview}</p>
      )}
      <header className="flex items-start gap-3">
        <Avatar name={review.author_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold">{review.author_name}</span>
            {review.author_plan && (
              <span className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-medium text-neon">
                <BadgeCheck className="h-3 w-3" />
                {tx.owner(review.author_plan)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {timeAgo(review.created_at, lang)}
            {review.edited && ` · ${tx.edited}`}
          </p>
        </div>
        <Stars value={review.rating} />
      </header>

      <p className="mt-4 whitespace-pre-line break-words leading-relaxed">{review.body}</p>

      <ReviewMedia review={review} />

      <footer className="-ml-2 mt-4 flex flex-wrap items-center gap-1">
        <ActionBtn onClick={like} active={liked} disabled={toggleLike.isPending}>
          <Heart className={cn("h-4 w-4", liked && "fill-pink-500 text-pink-500")} />
          {review.likes_count}
        </ActionBtn>
        <ActionBtn onClick={() => setOpen((o) => !o)} active={open}>
          <MessageCircle className="h-4 w-4" />
          {review.comments_count > 0 ? review.comments_count : tx.reply}
        </ActionBtn>
        <span className="flex-1" />
        {mine && (
          <ActionBtn onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            {tx.edit}
          </ActionBtn>
        )}
        {(mine || isAdmin) && (
          <ConfirmDelete
            label={mine ? tx.del : tx.adminDelete}
            admin={!mine}
            busy={del.isPending}
            onConfirm={() =>
              del.mutate(review, {
                onSuccess: () => toast.success(tx.deleted),
                onError: () => toast.error(tx.errGeneric),
              })
            }
          />
        )}
      </footer>

      {open && <Thread reviewId={review.id} isAdmin={isAdmin} />}
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Stránka                                                              */
/* ------------------------------------------------------------------ */
type Sort = "newest" | "top" | "liked";

const Reviews = () => {
  const tx = useTxt();
  const { user, session } = useAuth();
  const isAdmin = useIsAdmin() === true;
  const { data: reviews = [], isLoading, isError } = useReviews();
  const { data: canReview = false } = useCanReview();
  const { data: myLikes } = useMyLikes();
  const [sort, setSort] = useState<Sort>("newest");
  const [projectsOnly, setProjectsOnly] = useState(false);
  const [writing, setWriting] = useState(false);

  const mine = reviews.find((r) => r.user_id === user?.id);

  const stats = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => (dist[r.rating - 1] += 1));
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { avg, dist };
  }, [reviews]);

  const list = useMemo(() => {
    let l = reviews.filter((r) => r.id !== mine?.id);
    if (projectsOnly) l = l.filter((r) => r.youtube_url || r.video_path || r.project_url);
    const sorted = [...l];
    if (sort === "top") sorted.sort((a, b) => b.rating - a.rating || b.likes_count - a.likes_count);
    if (sort === "liked") sorted.sort((a, b) => b.likes_count - a.likes_count || b.rating - a.rating);
    return sorted;
  }, [reviews, mine?.id, projectsOnly, sort]);

  const sorts: { key: Sort; label: string }[] = [
    { key: "newest", label: tx.sortNewest },
    { key: "top", label: tx.sortTop },
    { key: "liked", label: tx.sortLiked },
  ];

  // Jedna jasná akcia podľa toho, kto sa pozerá.
  let action: ReactNode = null;
  if (!session) {
    action = (
      <div className="text-sm text-muted-foreground">
        <p>{tx.signInToJoin}</p>
        <Link to="/login" state={{ from: { pathname: "/alter/reviews" } }}>
          <Button className="mt-3 w-full sm:w-auto">{tx.signIn}</Button>
        </Link>
      </div>
    );
  } else if (canReview && !mine && !writing) {
    action = (
      <Button size="lg" onClick={() => setWriting(true)} className="w-full sm:w-auto">
        <Star className="fill-current" />
        {tx.write}
      </Button>
    );
  } else if (!canReview && !mine) {
    action = <p className="text-sm text-muted-foreground">{tx.onlyOwners}</p>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neon">
            Alter
          </span>
          <h1 className="mt-4 text-3xl font-bold text-glow sm:text-4xl md:text-5xl">{tx.title}</h1>
          <p className="mt-3 text-muted-foreground">{tx.subtitle}</p>
        </header>

        {/* Súhrn + hlavná akcia */}
        <section className="mt-8 grid gap-6 rounded-xl border border-border/50 bg-card/60 p-5 backdrop-blur sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1 sm:pr-6 sm:border-r sm:border-border/40">
            <span className="text-5xl font-bold tabular-nums">{reviews.length ? stats.avg.toFixed(1) : "–"}</span>
            <div>
              <Stars value={stats.avg} size="lg" />
              <p className="mt-1 text-xs text-muted-foreground">{tx.reviews(reviews.length)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = stats.dist[n - 1];
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 tabular-nums">{n}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
            {action}
          </div>
        </section>

        {writing && !mine && (
          <div className="mt-6">
            <ReviewForm onDone={() => setWriting(false)} />
          </div>
        )}

        {mine && (
          <div className="mt-6">
            <ReviewCard review={mine} liked={Boolean(myLikes?.has(mine.id))} isAdmin={isAdmin} highlight />
          </div>
        )}

        {/* Triedenie – jeden riadok, nič viac */}
        {reviews.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-border/60 bg-background/40 p-0.5">
              {sorts.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    sort === s.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProjectsOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                projectsOnly
                  ? "border-neon/60 bg-neon/15 text-neon"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Film className="h-3.5 w-3.5" />
              {tx.projectsOnly}
              {projectsOnly && <X className="h-3 w-3" />}
            </button>
          </div>
        )}

        <section className="mt-4 space-y-4">
          {isLoading && <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />}
          {isError && <p className="mt-10 text-center text-sm text-muted-foreground">{tx.errGeneric}</p>}
          {!isLoading && !isError && reviews.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">{tx.noReviews}</p>
          )}
          {list.map((r) => (
            <ReviewCard key={r.id} review={r} liked={Boolean(myLikes?.has(r.id))} isAdmin={isAdmin} />
          ))}
        </section>
      </div>
    </AppLayout>
  );
};

export default Reviews;
