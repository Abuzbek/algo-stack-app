import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { ExternalLink } from "lucide-react-native";
import clsx from "clsx";
import { Database } from "../types/database.types";

type Question = Database["public"]["Tables"]["questions"]["Row"] & {
  topics: { name: string; id: string }[];
};

interface LibraryCardProps {
  question: Question;
  isTracked: boolean;
  onTrack: (id: string) => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  question,
  isTracked,
  onTrack,
}) => {
  const difficultyColor =
    question.difficulty === "Easy"
      ? "bg-green-500"
      : question.difficulty === "Medium"
        ? "bg-yellow-500"
        : "bg-red-500";

  const openLeetCode = () => {
    Linking.openURL(`https://leetcode.com/problems/${question.title_slug}/`);
  };

  return (
    <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs text-gray-400 font-mono">
              #{question.question_frontend_id}
            </Text>
            <Text
              className="text-base font-bold text-gray-800 flex-shrink"
              numberOfLines={2}
            >
              {question.title}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-1">
            <View className={clsx("px-2 py-0.5 rounded-full", difficultyColor)}>
              <Text className="text-white text-xs font-medium">
                {question.difficulty}
              </Text>
            </View>
            {question.topics?.map((topic, idx) => (
              <View
                key={idx}
                className="border border-gray-200 px-2 py-0.5 rounded-full"
              >
                <Text className="text-gray-500 text-xs">{topic.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="flex-row justify-end items-center mt-4 pt-2 border-t border-gray-50 gap-3">
        <TouchableOpacity
          onPress={openLeetCode}
          className="flex-row items-center"
        >
          <Text className="text-indigo-600 text-sm font-medium mr-1">
            LeetCode
          </Text>
          <ExternalLink size={12} color="#4F46E5" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !isTracked && onTrack(question.id)}
          disabled={isTracked}
          className={clsx(
            "px-4 py-2 rounded-lg",
            isTracked ? "bg-green-100" : "bg-indigo-600",
          )}
        >
          <Text
            className={clsx(
              "font-medium text-sm",
              isTracked ? "text-green-700" : "text-white",
            )}
          >
            {isTracked ? "Tracked" : "Track"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
