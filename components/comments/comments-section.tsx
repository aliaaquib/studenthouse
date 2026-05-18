"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircleMore,
  Pencil,
  Pin,
  Reply,
  SendHorizonal,
  ShieldAlert,
  ThumbsUp,
  Trash2
} from "lucide-react";
import { motionEase } from "@/components/motion";
import { usePropertyComments } from "@/hooks/comments/use-property-comments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { createCommentSummaryLabel } from "@/lib/comments/utils";
import type { CommentSort, PropertyComment } from "@/types/comment";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / minute))}m ago`;
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function sortLabel(sort: CommentSort) {
  if (sort === "most-liked") return "Most liked";
  if (sort === "oldest") return "Oldest";
  return "Newest";
}

function roleBadgeClass(role: string) {
  if (role === "admin") return "bg-[rgba(122,92,250,0.12)] text-[rgb(99,76,216)]";
  if (role === "agent") return "bg-[rgba(23,166,115,0.12)] text-[rgb(19,132,92)]";
  return "bg-[var(--surface)] text-[var(--muted)]";
}

function CommentComposer({
  placeholder,
  submitLabel,
  busy,
  initialValue,
  onSubmit,
  onCancel
}: {
  placeholder: string;
  submitLabel: string;
  busy?: boolean;
  initialValue?: string;
  onSubmit: (value: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [value]);

  async function handleSubmit() {
    if (busy) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="min-h-[112px] w-full resize-none border-0 bg-transparent text-[14px] font-normal leading-[1.75] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        maxLength={1200}
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12px] font-normal text-[var(--muted)]">Minimum 3 characters. Keep it helpful for other students.</span>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="button" size="sm" disabled={busy || value.trim().length < 3} onClick={() => void handleSubmit()}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--surface)]" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-36 animate-pulse rounded-full bg-[var(--surface)]" />
          <div className="h-3 w-full animate-pulse rounded-full bg-[var(--surface)]" />
          <div className="h-3 w-[78%] animate-pulse rounded-full bg-[var(--surface)]" />
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  activeReplyId,
  setActiveReplyId,
  currentUserId,
  currentRole,
  pendingSet,
  onReply,
  onUpdate,
  onDelete,
  onLike,
  onModerate
}: {
  comment: PropertyComment;
  activeReplyId: string | null;
  setActiveReplyId: (value: string | null) => void;
  currentUserId: string | null;
  currentRole: string | null;
  pendingSet: Set<string>;
  onReply: (parentId: string, content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLike: (comment: PropertyComment) => Promise<void>;
  onModerate: (id: string, patch: { is_hidden?: boolean; is_pinned?: boolean }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const isAdminUser = currentRole === "admin";
  const canEdit = currentUserId === comment.userId || isAdminUser;
  const canDelete = currentUserId === comment.userId || isAdminUser;
  const canModerate = isAdminUser;
  const isReplying = activeReplyId === comment.id;
  const pending = pendingSet.has(comment.id);

  return (
    <article className={cn("rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]", comment.isHidden && "opacity-75")}>
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(23,166,115,0.12)] text-[13px] font-medium text-[var(--primary)]">
          {getInitials(comment.author.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[14px] font-medium text-[var(--foreground)]">{comment.author.name}</strong>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium capitalize", roleBadgeClass(comment.author.role))}>
              {comment.author.role}
            </span>
            {comment.isPinned ? (
              <span className="rounded-full bg-[rgba(122,92,250,0.12)] px-2.5 py-1 text-[11px] font-medium text-[rgb(99,76,216)]">
                Pinned
              </span>
            ) : null}
            {comment.isHidden ? (
              <span className="rounded-full bg-[rgba(255,193,7,0.16)] px-2.5 py-1 text-[11px] font-medium text-[rgb(153,108,0)]">
                Hidden by admin
              </span>
            ) : null}
            <span className="text-[12px] font-normal text-[var(--muted)]">
              {formatTimestamp(comment.createdAt)}{comment.isEdited ? " · Edited" : ""}
            </span>
          </div>

          {editing ? (
            <div className="mt-4">
              <CommentComposer
                placeholder="Edit your comment"
                submitLabel="Save"
                busy={pending}
                initialValue={comment.content}
                onCancel={() => setEditing(false)}
                onSubmit={async (value) => {
                  await onUpdate(comment.id, value);
                  setEditing(false);
                }}
              />
            </div>
          ) : (
            <p className="mt-3 text-[14px] font-normal leading-[1.75] text-[var(--muted-strong)]">{comment.content}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-9 rounded-full px-3", comment.likedByCurrentUser && "text-[var(--primary)]")}
              disabled={pending}
              onClick={() => void onLike(comment)}
            >
              <motion.span
                animate={{ scale: comment.likedByCurrentUser ? [1, 1.14, 1] : 1 }}
                transition={{ duration: 0.2, ease: motionEase }}
                className="inline-flex items-center gap-2"
              >
                <ThumbsUp size={15} fill={comment.likedByCurrentUser ? "currentColor" : "none"} />
                {comment.likesCount}
              </motion.span>
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full px-3" onClick={() => setActiveReplyId(isReplying ? null : comment.id)}>
              <Reply size={15} />
              Reply
            </Button>
            {canEdit && !editing ? (
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full px-3" disabled={pending} onClick={() => setEditing(true)}>
                <Pencil size={15} />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full px-3 text-[rgb(191,61,74)] hover:bg-[rgba(191,61,74,0.08)]" disabled={pending} onClick={() => void onDelete(comment.id)}>
                <Trash2 size={15} />
                Delete
              </Button>
            ) : null}
            {canModerate ? (
              <>
                <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full px-3" disabled={pending} onClick={() => void onModerate(comment.id, { is_hidden: !comment.isHidden })}>
                  <ShieldAlert size={15} />
                  {comment.isHidden ? "Unhide" : "Hide"}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-9 rounded-full px-3" disabled={pending} onClick={() => void onModerate(comment.id, { is_pinned: !comment.isPinned })}>
                  <Pin size={15} />
                  {comment.isPinned ? "Unpin" : "Pin"}
                </Button>
              </>
            ) : null}
          </div>

          <AnimatePresence initial={false}>
            {isReplying ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: motionEase }}
                className="mt-4"
              >
                <CommentComposer
                  placeholder={`Reply to ${comment.author.name}`}
                  submitLabel="Reply"
                  busy={pending}
                  onCancel={() => setActiveReplyId(null)}
                  onSubmit={async (value) => {
                    await onReply(comment.id, value);
                    setActiveReplyId(null);
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {comment.replies.length ? (
            <div className="mt-5">
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-[var(--muted-strong)] hover:bg-[var(--surface)]"
                onClick={() => setShowReplies((current) => !current)}
              >
                {showReplies ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showReplies ? "Hide" : "Show"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </button>
              <AnimatePresence initial={false}>
                {showReplies ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: motionEase }}
                    className="mt-4 space-y-4 border-l border-[var(--border)] pl-4 sm:pl-6"
                  >
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                        currentUserId={currentUserId}
                        currentRole={currentRole}
                        pendingSet={pendingSet}
                        onReply={onReply}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onLike={onLike}
                        onModerate={onModerate}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CommentsSection({
  propertyId,
  propertyName,
  propertySlug,
  initialComments
}: {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  initialComments: PropertyComment[];
}) {
  const {
    comments,
    loading,
    sort,
    setSort,
    user,
    profile,
    toast,
    posting,
    pendingSet,
    addComment,
    updateComment,
    deleteComment,
    toggleLike,
    moderateComment
  } = usePropertyComments({ propertyId, initialComments });
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const totalCount = useMemo(() => {
    const countReplies = (items: PropertyComment[]): number =>
      items.reduce((sum, item) => sum + 1 + countReplies(item.replies), 0);
    return countReplies(comments);
  }, [comments]);

  return (
    <section className="mt-12 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-medium leading-[1.3]">Student comments & reviews</h2>
          <p className="mt-2 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
            {totalCount ? `${createCommentSummaryLabel(totalCount)} about ${propertyName}.` : "Be the first student to comment on this property."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["newest", "oldest", "most-liked"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={sort === item ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSort(item)}
            >
              {sortLabel(item)}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {user ? (
          <CommentComposer
            placeholder={`Share what students should know about ${propertyName}`}
            submitLabel="Post comment"
            busy={posting}
            onSubmit={async (value) => {
              await addComment(value, null);
            }}
          />
        ) : (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
              Sign in to ask questions, leave a review, and keep track of replies in your account.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/login?next=${encodeURIComponent(`/properties/${propertySlug}`)}`}>Sign in to comment</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {loading && !comments.length ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              currentUserId={user?.id ?? null}
              currentRole={profile?.role ?? null}
              pendingSet={pendingSet}
              onReply={async (parentId, content) => {
                await addComment(content, parentId);
              }}
              onUpdate={async (id, content) => {
                await updateComment(id, content);
              }}
              onDelete={async (id) => {
                await deleteComment(id);
              }}
              onLike={async (commentItem) => {
                await toggleLike(commentItem);
              }}
              onModerate={async (id, patch) => {
                await moderateComment(id, patch);
              }}
            />
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
            <MessageCircleMore className="mx-auto text-[var(--primary)]" size={26} />
            <p className="mt-4 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
              Be the first student to comment on this property.
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-4 left-4 z-[95]">
        <AnimatePresence>
          {toast ? (
            <Toast className={toast.tone === "error" ? "border-[rgba(191,61,74,0.18)] text-[rgb(191,61,74)]" : undefined}>
              {toast.message}
            </Toast>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
