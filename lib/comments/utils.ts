import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/rbac";
import type { CommentSort, PropertyComment } from "@/types/comment";

type RawCommentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  created_at: string | null;
};

type RawCommentRow = {
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

export const commentSelect = `
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

function mapComment(row: RawCommentRow, profile: RawCommentProfile | null, likedIds: Set<string>): PropertyComment {
  const fallbackEmail = profile?.email ?? null;
  const fallbackName = fallbackEmail?.split("@")[0] || "Student";

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
      id: profile?.id ?? row.user_id,
      name: profile?.full_name?.trim() || fallbackName,
      email: fallbackEmail,
      avatarUrl: profile?.avatar_url ?? null,
      role: profile?.role ?? "student",
      createdAt: profile?.created_at ?? null
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

export function buildCommentTree(rows: RawCommentRow[], likedIds: Set<string>) {
  return buildCommentTreeWithProfiles(rows, new Map(), likedIds);
}

export function buildCommentTreeWithProfiles(
  rows: RawCommentRow[],
  profiles: Map<string, RawCommentProfile>,
  likedIds: Set<string>
) {
  const mapped = rows.map((row) => mapComment(row, profiles.get(row.user_id) ?? null, likedIds));
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

export async function fetchPropertyCommentsWithClient(
  supabase: SupabaseClient,
  propertyId: string,
  viewerId?: string | null
) {
  const [commentsResult, likesResult] = await Promise.all([
    supabase
      .from("comments")
      .select(commentSelect)
      .eq("property_id", propertyId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    viewerId
      ? supabase.from("comment_likes").select("comment_id").eq("user_id", viewerId)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (commentsResult.error) {
    throw new Error(commentsResult.error.message);
  }

  if (viewerId && likesResult.error) {
    throw new Error(likesResult.error.message);
  }

  const userIds = [...new Set(((commentsResult.data ?? []) as RawCommentRow[]).map((item) => item.user_id))];
  const profileMap = new Map<string, RawCommentProfile>();

  if (userIds.length) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, created_at")
      .in("id", userIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of profileRows ?? []) {
      profileMap.set(profile.id, profile as RawCommentProfile);
    }
  }

  const likedIds = new Set((likesResult.data ?? []).map((item) => item.comment_id));
  return buildCommentTreeWithProfiles((commentsResult.data ?? []) as RawCommentRow[], profileMap, likedIds);
}

export function createCommentSummaryLabel(count: number) {
  if (count === 1) return "1 comment";
  return `${count} comments`;
}
