import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Rating } from "../lib/scheduler";
import { ScheduleItem } from "../hooks/useDashboardData";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: Rating) => void;
  item: ScheduleItem | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
  item,
}) => {
  if (!item) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-center mb-1">
            How was it?
          </Text>
          <Text className="text-center text-gray-500 mb-6">
            {item.questions?.title}
          </Text>

          <View className="flex-row flex-wrap justify-between gap-2">
            <FeedbackButton
              title="Again"
              subtitle="< 1 min"
              color="bg-gray-100 text-gray-800"
              onPress={() => onSubmit("again")}
            />
            <FeedbackButton
              title="Hard"
              subtitle="2 days"
              color="bg-orange-100 text-orange-800"
              onPress={() => onSubmit("hard")}
            />
            <FeedbackButton
              title="Good"
              subtitle="4 days"
              color="bg-green-100 text-green-800"
              onPress={() => onSubmit("good")}
            />
            <FeedbackButton
              title="Easy"
              subtitle="7 days"
              color="bg-blue-100 text-blue-800"
              onPress={() => onSubmit("easy")}
            />
          </View>

          <TouchableOpacity onPress={onClose} className="mt-6 self-center">
            <Text className="text-gray-400">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const FeedbackButton = ({ title, subtitle, color, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 min-w-[45%] p-3 rounded-lg items-center mb-2 ${color.split(" ")[0]}`}
  >
    <Text className={`font-bold ${color.split(" ")[1]}`}>{title}</Text>
    <Text className={`text-xs opacity-70 ${color.split(" ")[1]}`}>
      {subtitle}
    </Text>
  </TouchableOpacity>
);
