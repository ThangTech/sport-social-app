import { api } from "@/services/api";
import type { CommentDto, CreateCommentRequest } from "@/types/comment";

export const getComments = async (postId: string) => {
  return await api<CommentDto[]>(`/posts/${postId}/comments`, {
    method: "GET",
    auth: true,
  });
};

export const createComment = async (
  postId: string,
  request: CreateCommentRequest,
) => {
  return await api<CommentDto>(`/posts/${postId}/comments`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(request),
  });
};
export const updateComment = async (commentId: string, content: string) => {
  return await api<CommentDto>(`/comments/${commentId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ content }),
  });
};

export const deleteComment = async (commentId: string) => {
  return await api<void>(`/comments/${commentId}`, {
    method: "DELETE",
    auth: true,
  });
};
