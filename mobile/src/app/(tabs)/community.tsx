import GroupListItem from "@/components/group/GroupListItem";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getGroups } from "@/services/group.service";
import { GroupListScope, type GroupDto } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;
const scopes = [
  {
    value: GroupListScope.Public,
    label: "Công khai",
    empty: "Chưa có nhóm công khai nào để khám phá.",
  },
  {
    value: GroupListScope.Private,
    label: "Riêng tư",
    empty: "Chưa có nhóm riêng tư nào để khám phá.",
  },
  {
    value: GroupListScope.Joined,
    label: "Đã tham gia",
    empty: "Bạn chưa tham gia nhóm nào.",
  },
];

export default function CommunityScreen() {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeScope, setActiveScope] = useState(GroupListScope.Public);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const loadingMoreRef = useRef(false);
  const activeSearchRef = useRef("");
  const activeScopeRef = useRef(GroupListScope.Public);

  const loadGroups = useCallback(
    async (
      search: string,
      scope: GroupListScope,
      cursor: string | null = null,
      append = false,
    ) => {
      try {
        if (!append) setErrorMessage("");

        const response = await getGroups(search, scope, PAGE_SIZE, cursor);

        if (
          activeSearchRef.current !== search
          || activeScopeRef.current !== scope
        ) {
          return;
        }

        setGroups((current) => {
          if (!append) return response.items;

          const existingIds = new Set(current.map((group) => group.id));
          const newGroups = response.items.filter(
            (group) => !existingIds.has(group.id),
          );
          return [...current, ...newGroups];
        });
        setNextCursor(response.nextCursor ?? null);
      } catch (error) {
        if (
          activeSearchRef.current !== search
          || activeScopeRef.current !== scope
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải nhóm.",
        );
      } finally {
        if (
          activeSearchRef.current === search
          && activeScopeRef.current === scope
        ) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadGroups(activeSearchRef.current, activeScopeRef.current);
    }, [loadGroups]),
  );

  const handleSearch = () => {
    const nextSearch = searchText.trim();

    activeSearchRef.current = nextSearch;
    setActiveSearch(nextSearch);
    setGroups([]);
    setNextCursor(null);
    setLoading(true);
    loadGroups(nextSearch, activeScopeRef.current);
  };

  const clearSearch = () => {
    setSearchText("");

    if (!activeSearch) return;

    activeSearchRef.current = "";
    setActiveSearch("");
    setGroups([]);
    setNextCursor(null);
    setLoading(true);
    loadGroups("", activeScopeRef.current);
  };

  const changeScope = (scope: GroupListScope) => {
    if (scope === activeScopeRef.current) return;

    activeScopeRef.current = scope;
    setActiveScope(scope);
    setGroups([]);
    setNextCursor(null);
    setLoading(true);
    loadGroups(activeSearchRef.current, scope);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups(activeSearchRef.current, activeScopeRef.current);
  };

  const handleLoadMore = () => {
    if (
      !nextCursor ||
      loading ||
      refreshing ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    loadGroups(
      activeSearchRef.current,
      activeScopeRef.current,
      nextCursor,
      true,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <AppText variant="title">Khám phá nhóm</AppText>
        <Pressable
          accessibilityLabel="Tạo nhóm"
          hitSlop={8}
          onPress={() => router.push("/group/create")}
          style={styles.headerButton}
        >
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={COLORS.primary}
          />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          placeholder="Tìm nhóm theo tên"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searchText ? (
          <Pressable hitSlop={8} onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
        <Pressable hitSlop={8} onPress={handleSearch}>
          <Ionicons
            name="arrow-forward-circle"
            size={24}
            color={COLORS.primary}
          />
        </Pressable>
      </View>

      <View style={styles.scopeTabs}>
        {scopes.map((scope) => (
          <Pressable
            key={scope.value}
            onPress={() => changeScope(scope.value)}
            style={[
              styles.scopeTab,
              activeScope === scope.value && styles.activeScopeTab,
            ]}
          >
            <AppText
              variant="caption"
              color={
                activeScope === scope.value
                  ? COLORS.background
                  : COLORS.textMuted
              }
              style={styles.scopeLabel}
            >
              {scope.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải danh sách nhóm...
          </AppText>
        </View>
      ) : errorMessage && groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.textMuted}
          />
          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadGroups(activeSearchRef.current, activeScopeRef.current);
            }}
          >
            <AppText variant="label" color={COLORS.background}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            groups.length === 0 && styles.emptyList,
          ]}
          ListHeaderComponent={
            errorMessage ? (
              <View style={styles.errorBox}>
                <AppText color={COLORS.danger}>{errorMessage}</AppText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="people-outline"
                size={52}
                color={COLORS.textMuted}
              />
              <AppText color={COLORS.textMuted} style={styles.message}>
                {activeSearch
                  ? "Không tìm thấy nhóm phù hợp."
                  : scopes.find((scope) => scope.value === activeScope)?.empty}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <GroupListItem
              group={item}
              onPress={() =>
                router.push({
                  pathname: "/group/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    margin: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  scopeTabs: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
  },
  scopeTab: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  activeScopeTab: {
    backgroundColor: COLORS.primary,
  },
  scopeLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  errorBox: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: "center",
  },
});
