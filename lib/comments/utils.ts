import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/rbac";
import type { CommentSort, PropertyComment } from "@/types/comment";

type BaseCommentRow = {
  id: string;
  property_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_edited: boolean;
  is_hidden: boolean;
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
};

type RawCommentRow = BaseCommentRow & {
  author_name: string | null;
  author_role: AppRole | null;
  author_avatar_url: string | null;
};

const baseCommentSelect = `
  id,
  property_id,
  user_id,
  parent_comment_id,
  content,
  is_edited,
  is_hidden,
  is_pinned,
  likes_count,
  created_at,
  updated_at
`;

export const commentSelect = `
  ${baseCommentSelect},
  author_name,
  author_role,
  author_avatar_url
`;

function hasAuthorSnapshotColumns(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return !(
    message.includes("author_name") ||
    message.includes("author_role") ||
    message.includes("author_avatar_url")
  );
}

function mapComment(row: RawCommentRow, likedIds: Set<string>): PropertyComment {
  const fallbackName = row.author_name?.trim() || "Student";

  return {
    id: row.id,
    propertyId: row.property_id,
    userId: row.user_id,
    parentCommentId: row.parent_comment_id,
    content: row.content,
    isEdited: row.is_edited,
    isHidden: row.is_hidden,
    isPinned: row.is_pinned,
    likesCount: row.likes_count ?? 0,
    likedByCurrentUser: likedIds.has(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.user_id,
      name: fallbackName,
      email: null,
      avatarUrl: row.author_avatar_url ?? null,
      role: row.author_role ?? "student",
      createdAt: null
    },
    replies: []
  };
}

function compareRoots(a: PropertyComment, b: PropertyComment, sort: CommentSort) {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

  if (sort === "most-liked") {
    if (a.likesCount !== b.likesCount) return b.likesCount - a.likesCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  if (sort === "oldest") {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortReplies(replies: PropertyComment[]): PropertyComment[] {
  return [...replies]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((reply) => ({ ...reply, replies: sortReplies(reply.replies) }));
}

export function sortCommentTree(comments: PropertyComment[], sort: CommentSort) {
  return [...comments]
    .sort((a, b) => compareRoots(a, b, sort))
    .map((comment) => ({ ...comment, replies: sortReplies(comment.replies) }));
}

function buildCommentTree(rows: RawCommentRow[], likedIds: Set<string>) {
  const mapped = rows.map((row) => mapComment(row, likedIds));
  const commentMap = new Map(mapped.map((comment) => [comment.id, { ...comment, replies: [] as PropertyComment[] }]));
  const roots: PropertyComment[] = [];

  for (const comment of commentMap.values()) {
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
        continue;
      }
    }

    roots.push(comment);
  }

  return sortCommentTree(roots, "newest");
}

async function fetchCommentRows(supabase: SupabaseClient, propertyId: string) {
  const withSnapshot = await supabase
    .from("comments")
    .select(commentSelect)
    .eq("property_id", propertyId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!withSnapshot.error) {
    return (withSnapshot.data ?? []) as RawCommentRow[];
  }

  if (hasAuthorSnapshotColumns(withSnapshot.error)) {
    throw new Error(withSnapshot.error.message);
  }

  const fallback = await supabase
    .from("comments")
    .select(baseCommentSelect)
    .eq("property_id", propertyId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  return ((fallback.data ?? []) as BaseCommentRow[]).map((row) => ({
    ...row,
    author_name: null,
    author_role: null,
    author_avatar_url: null
  }));
}

export async function fetchPropertyCommentsWithClient(
  supabase: SupabaseClient,
  propertyId: string,
  viewerId?: string | null
) {
  const [commentsResult, likesResult] = await Promise.all([
    fetchCommentRows(supabase, propertyId),
    viewerId
      ? supabase.from("comment_likes").select("comment_id").eq("user_id", viewerId)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (viewerId && likesResult.error) {
    throw new Error(likesResult.error.message);
  }

  const likedIds = new Set((likesResult.data ?? []).map((item) => item.comment_id));
  return buildCommentTree(commentsResult, likedIds);
}

export function createCommentSummaryLabel(count: number) {
  if (count === 1) return "1 comment";
  return `${count} comments`;
}
