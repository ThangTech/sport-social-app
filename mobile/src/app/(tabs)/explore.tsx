import Avatar from "@/components/Avatar";
import PostCard from "@/components/PostCard";
import GroupListItem from "@/components/group/GroupListItem";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import { getFileUrl } from "@/services/api";
import { getExploreGroups, getExplorePosts, getExploreUsers, type ExploreSection, type ExploreSort } from "@/services/explore.service";
import { getSports } from "@/services/sport.service";
import type { GroupDto } from "@/types/group";
import type { Post } from "@/types/post";
import type { SportDto } from "@/types/sport";
import type { UserSummaryDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ExploreItem = { kind: "post"; value: Post } | { kind: "group"; value: GroupDto } | { kind: "user"; value: UserSummaryDto };
const tabs: { key: ExploreSection; label: string }[] = [{ key: "posts", label: "Bài viết" }, { key: "groups", label: "Nhóm" }, { key: "users", label: "Mọi người" }];

export default function ExploreScreen() {
  const { user } = useAuth();
  const [section, setSection] = useState<ExploreSection>("posts");
  const [sort, setSort] = useState<ExploreSort>("recommended");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [sportId, setSportId] = useState<string | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestKeyRef = useRef("");
  const loadingMoreRef = useRef(false);

  const load = useCallback(async (targetPage = 1, append = false) => {
    if (!user?.id) return;
    const requestKey = `${user.id}|${section}|${sort}|${search}|${sportId ?? ""}`;
    requestKeyRef.current = requestKey;
    try {
      if (!append) setError("");
      const response = section === "posts"
        ? await getExplorePosts(targetPage, search, sort, sportId)
        : section === "groups"
          ? await getExploreGroups(targetPage, search, sort)
          : await getExploreUsers(targetPage, search, sort);
      if (requestKeyRef.current !== requestKey) return;
      const mapped: ExploreItem[] = section === "posts"
        ? (response.items as Parameters<typeof mapFeedPostToPost>[0][]).map(value => ({ kind: "post", value: mapFeedPostToPost(value) }))
        : section === "groups"
          ? (response.items as GroupDto[]).map(value => ({ kind: "group", value }))
          : (response.items as UserSummaryDto[]).map(value => ({ kind: "user", value }));
      setItems(current => append ? [...current, ...mapped.filter(item => !current.some(old => old.value.id === item.value.id))] : mapped);
      setPage(response.page); setTotal(response.total);
    } catch (value) {
      if (requestKeyRef.current !== requestKey) return;
      if (!append) setItems([]);
      setError(value instanceof Error ? value.message : "Không thể tải nội dung khám phá.");
    } finally {
      if (requestKeyRef.current === requestKey) { setLoading(false); setRefreshing(false); setLoadingMore(false); loadingMoreRef.current = false; }
    }
  }, [search, section, sort, sportId, user?.id]);

  useFocusEffect(useCallback(() => {
    setLoading(true); setItems([]); setPage(1); void load();
    void getSports().then(setSports).catch(() => setSports([]));
  }, [load]));

  const changeSection = (value: ExploreSection) => { setSection(value); setSportId(null); };
  const openPost = (id: string) => router.push({ pathname: "/post/[id]", params: { id } });

  const header = <View>
    <View style={styles.searchRow}>
      <View style={styles.searchBox}><Ionicons name="search" size={19} color={COLORS.textMuted} /><TextInput value={searchText} onChangeText={setSearchText} onSubmitEditing={() => setSearch(searchText)} returnKeyType="search" placeholder="Tìm bài viết, nhóm, mọi người" placeholderTextColor={COLORS.textMuted} style={styles.searchInput} /></View>
      <Pressable style={styles.searchButton} onPress={() => setSearch(searchText)}><AppText variant="label" color={COLORS.background}>Tìm</AppText></Pressable>
    </View>
    <View style={styles.tabs}>{tabs.map(tab => <Pressable key={tab.key} style={[styles.tab, section === tab.key && styles.tabActive]} onPress={() => changeSection(tab.key)}><AppText variant="label" color={section === tab.key ? COLORS.primary : COLORS.textMuted}>{tab.label}</AppText></Pressable>)}</View>
    <View style={styles.sortRow}><Pressable style={[styles.chip, sort === "recommended" && styles.chipActive]} onPress={() => setSort("recommended")}><AppText variant="caption">Đề xuất</AppText></Pressable><Pressable style={[styles.chip, sort === "latest" && styles.chipActive]} onPress={() => setSort("latest")}><AppText variant="caption">Mới nhất</AppText></Pressable></View>
    {section === "posts" ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sports}><Pressable style={[styles.chip, sportId === null && styles.chipActive]} onPress={() => setSportId(null)}><AppText variant="caption">Tất cả môn</AppText></Pressable>{sports.map(sport => <Pressable key={sport.id} style={[styles.chip, sportId === sport.id && styles.chipActive]} onPress={() => setSportId(sport.id)}><AppText variant="caption">{sport.name}</AppText></Pressable>)}</ScrollView> : null}
    {error && items.length > 0 ? <View style={styles.inlineError}><AppText color={COLORS.danger}>{error}</AppText></View> : null}
  </View>;

  return <SafeAreaView style={styles.container}>
    <View style={styles.title}><AppText variant="title">Khám phá</AppText></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /><AppText color={COLORS.textMuted}>Đang tìm nội dung phù hợp...</AppText></View> : error && items.length === 0 ? <View style={styles.center}><Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} /><AppText color={COLORS.textMuted} style={styles.message}>{error}</AppText><Pressable style={styles.retry} onPress={() => { setLoading(true); void load(); }}><AppText color={COLORS.background}>Thử lại</AppText></Pressable></View> : <FlatList data={items} key={`${section}-${search}-${sort}-${sportId}`} keyExtractor={item => `${item.kind}-${item.value.id}`} ListHeaderComponent={header} contentContainerStyle={section === "posts" ? undefined : styles.listContent} ListEmptyComponent={<View style={styles.center}><AppText color={COLORS.textMuted}>Không tìm thấy kết quả phù hợp.</AppText></View>} renderItem={({ item }) => item.kind === "post" ? <PostCard post={item.value} onPress={() => openPost(item.value.id)} onCommentPress={() => openPost(item.value.id)} onAuthorPress={() => router.push({ pathname: "/user/[id]", params: { id: item.value.authorId } })} onDeleted={id => setItems(current => current.filter(x => x.value.id !== id))} /> : item.kind === "group" ? <GroupListItem group={item.value} onPress={() => router.push({ pathname: "/group/[id]", params: { id: item.value.id } })} /> : <Pressable style={styles.userItem} onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.value.id } })}><Avatar source={item.value.avatarUrl ? { uri: getFileUrl(item.value.avatarUrl)! } : require("../../../assets/images/icon.png")} /><View style={styles.userCopy}><AppText variant="label">{item.value.displayName}</AppText><AppText variant="caption" color={COLORS.textMuted}>@{item.value.userName}</AppText></View><Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} /></Pressable>} ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator color={COLORS.primary} /></View> : null} onEndReached={() => { if (items.length >= total || loadingMoreRef.current) return; loadingMoreRef.current = true; setLoadingMore(true); void load(page + 1, true); }} onEndReachedThreshold={0.4} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, title: { height: 64, alignItems: "center", justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, searchRow: { padding: SPACING.md, flexDirection: "row", gap: SPACING.sm }, searchBox: { flex: 1, minHeight: 44, paddingHorizontal: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, backgroundColor: COLORS.surface }, searchInput: { flex: 1, color: COLORS.text }, searchButton: { paddingHorizontal: SPACING.lg, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.full, backgroundColor: COLORS.primary }, tabs: { paddingHorizontal: SPACING.md, flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, tab: { flex: 1, paddingVertical: SPACING.md, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" }, tabActive: { borderBottomColor: COLORS.primary }, sortRow: { padding: SPACING.md, paddingBottom: SPACING.sm, flexDirection: "row", gap: SPACING.sm }, sports: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm }, chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, backgroundColor: COLORS.surface }, chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt }, listContent: { gap: SPACING.sm, paddingBottom: SPACING.lg }, inlineError: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.surface }, center: { flex: 1, minHeight: 220, padding: SPACING.xl, alignItems: "center", justifyContent: "center", gap: SPACING.md }, message: { textAlign: "center" }, retry: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.primary }, userItem: { marginHorizontal: SPACING.md, padding: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface }, userCopy: { flex: 1, gap: SPACING.xs }, footer: { padding: SPACING.lg, alignItems: "center" } });
