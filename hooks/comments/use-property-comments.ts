"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchPropertyCommentsWithClient, sortCommentTree } from "@/lib/comments/utils";
import { isAdmin } from "@/lib/rbac";
import type { CommentSort, PropertyComment } from "@/types/comment";

type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;

function updateCommentTree(
  comments: PropertyComment[],
  targetId: string,
  updater: (comment: PropertyComment) => PropertyComment
): PropertyComment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }

    if (!comment.replies.length) return comment;
    return { ...comment, replies: updateCommentTree(comment.replies, targetId, updater) };
  });
}

function removeCommentFromTree(comments: PropertyComment[], targetId: string): PropertyComment[] {
  return comments
    .filter((comment) => comment.id !== targetId)
    .map((comment) => ({ ...comment, replies: removeCommentFromTree(comment.replies, targetId) }));
}

function prependComment(comments: PropertyComment[], comment: PropertyComment) {
  if (!comment.parentCommentId) return [comment, ...comments];

  return updateCommentTree(comments, comment.parentCommentId, (parent) => ({
    ...parent,
    replies: [...parent.replies, comment]
  }));
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export function usePropertyComments({
  propertyId,
  initialComments
}: {
  propertyId: string;
  initialComments: PropertyComment[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { supabase, user, profile, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<PropertyComment[]>(() => initialComments);
  const [loading, setLoading] = useState(Boolean(!initialComments.length));
  const [sort, setSort] = useState<CommentSort>("newest");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duplicateGuard = useRef<{ content: string; at: number } | null>(null);

  const showToast = useCallback((next: ToastState) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (next) {
      toastTimer.current = setTimeout(() => setToast(null), 2600);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const refreshComments = useCallback(async () => {
    if (!supabase) return null;
    return fetchPropertyCommentsWithClient(supabase, propertyId, user?.id ?? null);
  }, [propertyId, supabase, user]);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      Promise.resolve().then(() => {
        if (active) {
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const nextComments = await refreshComments();
        if (!active || !nextComments) return;
        setComments(nextComments);
      } catch (error) {
        if (active) {
          showToast({ tone: "error", message: formatError(error) });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshComments, showToast, supabase]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel(`property-comments:${propertyId}:${user?.id ?? "guest"}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `property_id=eq.${propertyId}`
      },
      () => {
        void refreshComments().then((nextComments) => {
          if (nextComments) {
            setComments(nextComments);
          }
        });
      }
    );
    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [propertyId, refreshComments, supabase, user?.id]);

  const sortedComments = useMemo(() => sortCommentTree(comments, sort), [comments, sort]);
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  function pushPending(id: string) {
    setPendingIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function clearPending(id: string) {
    setPendingIds((current) => current.filter((item) => item !== id));
  }

  function requireAuth() {
    if (!supabase || !user) {
      router.push(`/login?next=${encodeURIComponent(pathname || `/properties`)}`);
      return false;
    }

    return true;
  }

  async function addComment(content: string, parentCommentId?: string | null) {
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      showToast({ tone: "error", message: "Comment must be at least 3 characters." });
      return { ok: false };
    }

    const normalized = trimmed.toLowerCase();
    const previous = duplicateGuard.current;
    if (previous && previous.content === normalized && Date.now() - previous.at < 8000) {
      showToast({ tone: "error", message: "Please avoid posting the same comment twice." });
      return { ok: false };
    }

    if (!requireAuth() || !supabase || !user) return { ok: false };

    duplicateGuard.current = { content: normalized, at: Date.now() };
    setPosting(true);

    const optimisticId = `pending-${Date.now()}`;
    const optimisticComment: PropertyComment = {
      id: optimisticId,
      propertyId,
      userId: user.id,
      parentCommentId: parentCommentId ?? null,
      content: trimmed,
      isEdited: false,
      isHidden: false,
      isPinned: false,
      likesCount: 0,
      likedByCurrentUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      optimistic: true,
      author: {
        id: user.id,
        name: profile?.full_name?.trim() || user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
        email: user.email ?? null,
        avatarUrl: null,
        role: profile?.role ?? "student",
        createdAt: null
      },
      replies: []
    };

    setComments((current) => prependComment(current, optimisticComment));

    try {
      const { error } = await supabase.from("comments").insert({
        property_id: propertyId,
        user_id: user.id,
        parent_comment_id: parentCommentId ?? null,
        content: trimmed
      });

      if (error) throw error;

      showToast({ tone: "success", message: "Comment posted" });
      const nextComments = await refreshComments();
      if (nextComments) setComments(nextComments);
      return { ok: true };
    } catch (error) {
      setComments((current) => removeCommentFromTree(current, optimisticId));
      showToast({ tone: "error", message: formatError(error) || "Failed to post comment" });
      return { ok: false };
    } finally {
      setPosting(false);
    }
  }

  async function updateComment(id: string, content: string) {
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      showToast({ tone: "error", message: "Comment must be at least 3 characters." });
      return { ok: false };
    }

    if (!requireAuth() || !supabase) return { ok: false };

    pushPending(id);
    const snapshot = comments;
    setComments((current) =>
      updateCommentTree(current, id, (comment) => ({
        ...comment,
        content: trimmed,
        isEdited: true,
        updatedAt: new Date().toISOString()
      }))
    );

    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: trimmed,
          is_edited: true
        })
        .eq("id", id);

      if (error) throw error;

      showToast({ tone: "success", message: "Comment updated" });
      return { ok: true };
    } catch (error) {
      setComments(snapshot);
      showToast({ tone: "error", message: formatError(error) });
      return { ok: false };
    } finally {
      clearPending(id);
    }
  }

  async function deleteComment(id: string) {
    if (!requireAuth() || !supabase) return { ok: false };

    pushPending(id);
    const snapshot = comments;
    setComments((current) => removeCommentFromTree(current, id));

    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;

      showToast({ tone: "success", message: "Comment removed" });
      return { ok: true };
    } catch (error) {
      setComments(snapshot);
      showToast({ tone: "error", message: formatError(error) });
      return { ok: false };
    } finally {
      clearPending(id);
    }
  }

  async function toggleLike(comment: PropertyComment) {
    if (!requireAuth() || !supabase || !user) return { ok: false };

    pushPending(comment.id);
    const snapshot = comments;
    const nextLiked = !comment.likedByCurrentUser;
    setComments((current) =>
      updateCommentTree(current, comment.id, (item) => ({
        ...item,
        likedByCurrentUser: nextLiked,
        likesCount: Math.max(0, item.likesCount + (nextLiked ? 1 : -1))
      }))
    );

    try {
      const query = nextLiked
        ? supabase.from("comment_likes").insert({ comment_id: comment.id, user_id: user.id })
        : supabase.from("comment_likes").delete().eq("comment_id", comment.id).eq("user_id", user.id);

      const { error } = await query;
      if (error) throw error;
      return { ok: true };
    } catch (error) {
      setComments(snapshot);
      showToast({ tone: "error", message: formatError(error) });
      return { ok: false };
    } finally {
      clearPending(comment.id);
    }
  }

  async function moderateComment(id: string, patch: { is_hidden?: boolean; is_pinned?: boolean }) {
    if (!isAdmin(profile?.role) || !supabase) return { ok: false };

    pushPending(id);
    const snapshot = comments;
    setComments((current) =>
      updateCommentTree(current, id, (comment) => ({
        ...comment,
        isHidden: patch.is_hidden ?? comment.isHidden,
        isPinned: patch.is_pinned ?? comment.isPinned
      }))
    );

    try {
      const { error } = await supabase.from("comments").update(patch).eq("id", id);
      if (error) throw error;

      showToast({ tone: "success", message: "Comment updated" });
      return { ok: true };
    } catch (error) {
      setComments(snapshot);
      showToast({ tone: "error", message: formatError(error) });
      return { ok: false };
    } finally {
      clearPending(id);
    }
  }

  return {
    comments: sortedComments,
    rawComments: comments,
    loading: loading || authLoading,
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
  };
}
