import clsx from "clsx";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/AuthProvider";
import { LibraryCard } from "../../components/LibraryCard";
import { useTopics } from "../../hooks/useDashboardData";
import {
  useQuestions,
  useStudyLists,
  useTrackQuestion,
  useTrackedQuestions,
} from "../../hooks/useLibraryData";
// useDebounceValue inline
const useDebounceValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function LibraryScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 500);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedStudyList, setSelectedStudyList] = useState<string | null>(
    null,
  );

  const { data: topics } = useTopics();
  const { data: studyLists } = useStudyLists();
  const { data: trackedQuestions } = useTrackedQuestions(user?.id);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useQuestions(debouncedSearch, selectedTopic, selectedStudyList);
  const trackQuestion = useTrackQuestion();

  const questions = useMemo(() => {
    return data?.pages.flatMap((page) => page.questions) || [];
  }, [data]);

  const handleTrack = async (questionId: string) => {
    if (!user) {
      // Show auth alert or navigate to login
      alert("Please login first");
      return;
    }
    trackQuestion.mutate({ userId: user.id, questionId });
  };

  const renderHeader = () => (
    <View className="px-4 pt-4 bg-white z-10">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-gray-900">
          Problem Library
        </Text>
        <Text className="text-gray-500 mt-1">
          {questions.length} problems loaded
        </Text>
      </View>

      {/* Search */}
      <View className="mb-4">
        <TextInput
          placeholder="Search by name or ID..."
          className="bg-gray-100 p-3 rounded-lg text-base border border-gray-200"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters Row */}
      <View className="mb-4">
        {/* Study Lists */}
        {studyLists && studyLists.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3 flex-row gap-2"
            keyboardShouldPersistTaps="always"
          >
            <TouchableOpacity
              onPress={() => setSelectedStudyList(null)}
              className={clsx(
                "px-3 py-1.5 rounded-lg border mr-2",
                !selectedStudyList
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-white border-gray-300",
              )}
            >
              <Text
                className={clsx(
                  "text-sm font-medium",
                  !selectedStudyList ? "text-indigo-700" : "text-gray-700",
                )}
              >
                Lc All
              </Text>
            </TouchableOpacity>
            {studyLists.map((list: any) => (
              <TouchableOpacity
                key={list.id}
                onPress={() => setSelectedStudyList(list.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg border mr-2",
                  selectedStudyList === list.id
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-white border-gray-300",
                )}
              >
                <Text
                  className={clsx(
                    "text-sm font-medium",
                    selectedStudyList === list.id
                      ? "text-indigo-700"
                      : "text-gray-700",
                  )}
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Topics */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-2"
          keyboardShouldPersistTaps="always"
        >
          <TouchableOpacity
            onPress={() => setSelectedTopic(null)}
            className={clsx(
              "px-4 py-2 rounded-full border mr-2",
              !selectedTopic
                ? "bg-gray-900 border-gray-900"
                : "bg-white border-gray-300",
            )}
          >
            <Text
              className={clsx(
                "font-medium",
                !selectedTopic ? "text-white" : "text-gray-700",
              )}
            >
              All Topics
            </Text>
          </TouchableOpacity>
          {topics?.map((topic: any) => (
            <TouchableOpacity
              key={topic.id}
              onPress={() => setSelectedTopic(topic.id)}
              className={clsx(
                "px-4 py-2 rounded-full border mr-2",
                selectedTopic === topic.id
                  ? "bg-gray-900 border-gray-900"
                  : "bg-white border-gray-300",
              )}
            >
              <Text
                className={clsx(
                  "font-medium",
                  selectedTopic === topic.id ? "text-white" : "text-gray-700",
                )}
              >
                {topic.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator className="py-4" color="#4F46E5" />;
    }
    if (!hasNextPage && questions.length > 0) {
      return (
        <View className="py-8 items-center">
          <Text className="text-gray-400">End of list</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading)
      return (
        <ActivityIndicator size="large" className="mt-20" color="#4F46E5" />
      );
    return (
      <View className="py-20 items-center px-4">
        <Text className="text-gray-400 text-center text-lg">
          No questions found matching your criteria.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{ title: "Library", headerShadowVisible: false }}
      />
      {renderHeader()}
      <FlatList
        className="flex-1"
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <LibraryCard
              question={item}
              isTracked={trackedQuestions?.has(item.id) || false}
              onTrack={handleTrack}
            />
          </View>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}
