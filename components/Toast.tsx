import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToastStore } from "../stores/toastStore";

export const Toast = () => {
  const { message, type, visible, hide } = useToastStore();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hide();
      });
    }
  }, [visible, opacity, hide]);

  if (!visible) return null;

  const bgColors = {
    success: "#10B981", // Green
    error: "#EF4444", // Red
    info: "#3B82F6", // Blue
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <SafeAreaView>
        <Animated.View
          style={[
            styles.toast,
            { opacity, backgroundColor: bgColors[type] || bgColors.info },
          ]}
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
