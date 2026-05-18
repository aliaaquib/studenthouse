import type { AppRole } from "@/lib/rbac";

export type CommentSort = "newest" | "oldest" | "most-liked";

export type CommentAuthor = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: AppRole;
  createdAt: string | null;
};

export type PropertyComment = {
  id: string;
  propertyId: string;
  userId: string;
  parentCommentId: string | null;
  content: string;
  isEdited: boolean;
  isHidden: boolean;
  isPinned: boolean;
  likesCount: number;
  likedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  replies: PropertyComment[];
  optimistic?: boolean;
};
