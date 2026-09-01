import { Post } from "@/types/post";
import { User } from "@/types/user";
export const MOCK_POSTS: Post[] = [
  {
    id: "1",
    authorId: "user-1",
    authorName: "Nguyễn Văn Thắng",
    authorAvatar: require("../../assets/images/icon.png"),
    groupId: "group-1",
    groupName: "Cộng đồng yêu bóng đá",
    createdAt: "30 phút trước",
    content: "Một buổi tập tuyệt vời cùng đồng đội! ⚽",
    image: require("../../assets/images/football.jpg"),
    sport: "Bóng đá",
    likeCount: 192,
    commentCount: 10,
  },
  {
    id: "2",
    authorId: "user-2",
    authorName: "Nguyễn Văn Thắng",
    authorAvatar: require("../../assets/images/icon.png"),
    createdAt: "30 phút trước",
    content: "Một buổi tập tuyệt vời cùng đồng đội! ⚽",
    image: require("../../assets/images/football.jpg"),
    sport: "Bóng đá",
    likeCount: 192,
    commentCount: 10,
  },
  {
    id: "3",
    authorId: "user-3",
    authorName: "Nguyễn Văn Thắng",
    authorAvatar: require("../../assets/images/icon.png"),
    groupId: "group-1",
    groupName: "Cộng đồng yêu bóng đá 2",
    createdAt: "30 phút trước",
    content: "Một buổi tập tuyệt vời cùng đồng đội! ⚽",
    image: require("../../assets/images/football.jpg"),
    sport: "Bóng đá",
    likeCount: 192,
    commentCount: 10,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    name: "Nguyễn Văn An",
    username: "nguyenvanan",
    avatar: require("@/assets/images/football.jpg"),
    bio: "Yêu bóng đá và chạy bộ ⚽🏃",
    followerCount: 325,
    followingCount: 128,
  },

  {
    id: "user-2",
    name: "Trần Minh Đức",
    username: "minhduc",
    avatar: require("@/assets/images/football.jpg"),
    bio: "Basketball lover 🏀",
    followerCount: 184,
    followingCount: 92,
  },

  {
    id: "user-3",
    name: "Lê Hoàng Nam",
    username: "hoangnam",
    avatar: require("@/assets/images/football.jpg"),
    bio: "Football is life ⚽",
    followerCount: 542,
    followingCount: 210,
  },
];
