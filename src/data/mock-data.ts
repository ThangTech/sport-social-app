import { Post } from "@/types/post";

export const MOCK_POSTS: Post[] = [
  {
    id: "1",
    authorName: "Nguyễn Văn Thắng",
    authorAvatar: require("../../assets/images/icon.png"),
    createdAt: "30 phút trước",
    content: "Một buổi tập tuyệt vời cùng đồng đội! ⚽",
    image: require("../../assets/images/football.jpg"),
    sport: "Bóng đá",
    likeCount: 192,
    commentCount: 10,
  },
];