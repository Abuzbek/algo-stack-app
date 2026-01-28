import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { ScheduleItem } from "../hooks/useDashboardData";
import clsx from "clsx";
import { ExternalLink } from "lucide-react-native";

interface QuestionCardProps {
  item: ScheduleItem;
  onReview?: (item: ScheduleItem) => void;
  type?: "review" | "future" | "new";
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  item,
  onReview,
  type = "review",
}) => {
  const isReview = type === "review";
  const isNew = type === "new";
  const isFuture = type === "future";

  const borderColor = isReview
    ? "border-red-500"
    : isNew
      ? "border-blue-400"
      : "border-gray-200";
  const borderLeftWidth = isFuture ? 0 : 4;

  const difficultyColor =
    item.questions?.difficulty === "Easy"
      ? "bg-green-500"
      : item.questions?.difficulty === "Medium"
        ? "bg-yellow-500"
        : "bg-red-500";

  const openLeetCode = () => {
    if (item.questions?.title_slug) {
      Linking.openURL(
        `https://leetcode.com/problems/${item.questions.title_slug}/`,
      );
    }
  };

  return (
    <View
      className={clsx(
        "bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-100",
        `border-l-[${borderLeftWidth}px]`,
        isReview && "border-l-red-500",
        isNew && "border-l-blue-400",
      )}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs text-gray-400 font-mono">
              #{item.questions?.question_frontend_id}
            </Text>
            <Text
              className="text-base font-bold text-gray-800 flex-shrink"
              numberOfLines={2}
            >
              {item.questions?.title}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-1">
            <View className={clsx("px-2 py-0.5 rounded-full", difficultyColor)}>
              <Text className="text-white text-xs font-medium">
                {item.questions?.difficulty}
              </Text>
            </View>
            {item.questions?.question_topics?.map((qt, idx) => (
              <View
                key={idx}
                className="border border-gray-200 px-2 py-0.5 rounded-full"
              >
                <Text className="text-gray-500 text-xs">{qt.topics?.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {isFuture && (
          <View className="bg-gray-100 px-2 py-1 rounded">
            <Text className="text-xs text-gray-500">
              Due {new Date(item.next_review_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <TouchableOpacity
          onPress={openLeetCode}
          className="flex-row items-center"
        >
          <Text className="text-gray-500 text-sm mr-1">Solve</Text>
          <ExternalLink size={14} color="#6B7280" />
        </TouchableOpacity>

        {(isReview || isNew) && (
          <TouchableOpacity
            onPress={() => onReview && onReview(item)}
            className="bg-indigo-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium text-sm">
              {isNew ? "Start Learning" : "Mark Complete"}
            </Text>
          </TouchableOpacity>
        )}
        {isFuture && (
          <TouchableOpacity onPress={openLeetCode}>
            <Text className="text-indigo-600 text-sm font-medium">
              View Problem
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
