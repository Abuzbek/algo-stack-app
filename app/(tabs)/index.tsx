import clsx from "clsx";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeedbackModal } from "../../components/FeedbackModal";
import { QuestionCard } from "../../components/QuestionCard";
import {
  ScheduleItem,
  useTopics,
  useUpdateSchedule,
  useUserSchedule,
} from "../../hooks/useDashboardData";
import { calculateNextSchedule, Rating } from "../../lib/scheduler";

// Simple debounce hook implementation inline if not verified existing
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

export default function DashboardScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 500);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { data: topics } = useTopics() as any;
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserSchedule(debouncedSearch, selectedTopic);
  const updateSchedule = useUpdateSchedule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const allItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const groupedItems = useMemo(() => {
    const now = new Date();
    const groups = {
      review: [] as ScheduleItem[],
      future: [] as ScheduleItem[],
      new: [] as ScheduleItem[],
    };

    allItems.forEach((item) => {
      if (item.status === "new") {
        groups.new.push(item);
      } else {
        const reviewDate = new Date(item.next_review_at);
        if (reviewDate <= now) {
          groups.review.push(item);
        } else {
          groups.future.push(item);
        }
      }
    });
    return groups;
  }, [allItems]);

  const handleReview = (item: ScheduleItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSubmitFeedback = (rating: Rating) => {
    if (!selectedItem) return;

    const { nextInterval, nextReviewAt } = calculateNextSchedule(
      rating,
      selectedItem.interval_days,
    );

    updateSchedule.mutate({
      id: selectedItem.id,
      updates: {
        next_review_at: nextReviewAt,
        interval_days: nextInterval,
        status: rating === "again" ? "learning" : "reviewing",
      },
    });

    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <ActivityIndicator size="large" className="mt-10" color="#4F46E5" />
      );
    }

    if (allItems.length === 0 && !isLoading) {
      return (
        <View className="py-10 items-center">
          <Text className="text-gray-400">
            No schedule items found. Go to Library to track problems!
          </Text>
        </View>
      );
    }

    return (
      <View className="pb-20">
        {groupedItems.review.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1.5 h-6 bg-red-500 rounded mr-2" />
              <Text className="text-lg font-bold">Review Now</Text>
              <View className="bg-red-500 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-white text-xs font-bold">
                  {groupedItems.review.length}
                </Text>
              </View>
            </View>
            {groupedItems.review.map((item) => (
              <QuestionCard
                key={item.id}
                item={item}
                type="review"
                onReview={handleReview}
              />
            ))}
          </View>
        )}

        {groupedItems.future.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1.5 h-6 bg-green-500 rounded mr-2" />
              <Text className="text-lg font-bold">Future Reviews</Text>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-gray-600 text-xs font-bold">
                  {groupedItems.future.length}
                </Text>
              </View>
            </View>
            {groupedItems.future.map((item) => (
              <QuestionCard key={item.id} item={item} type="future" />
            ))}
          </View>
        )}

        {groupedItems.new.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-1.5 h-6 bg-blue-500 rounded mr-2" />
              <Text className="text-lg font-bold">New Problems</Text>
              <View className="bg-blue-500 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-white text-xs font-bold">
                  {groupedItems.new.length}
                </Text>
              </View>
            </View>
            {groupedItems.new.map((item) => (
              <QuestionCard
                key={item.id}
                item={item}
                type="new"
                onReview={handleReview}
              />
            ))}
          </View>
        )}

        {hasNextPage && (
          <TouchableOpacity
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="p-4 items-center"
          >
            {isFetchingNextPage ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <Text className="text-indigo-600">Load More</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{ title: "Dashboard", headerShadowVisible: false }}
      />
      <View className="px-4 pt-4 bg-white z-10">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">
            Today's Review
          </Text>
          <Text className="text-gray-500 mt-1">
            {allItems.length} due tasks
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

        {/* Topics */}
        <View className="mb-6">
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
                All
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

      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="always">
        {renderContent()}
      </ScrollView>

      <FeedbackModal
        visible={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitFeedback}
      />
    </SafeAreaView>
  );
}
