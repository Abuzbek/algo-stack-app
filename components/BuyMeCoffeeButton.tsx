import React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export const BuyMeCoffeeButton = () => {
  const openBMC = () => {
    Linking.openURL("https://www.buymeacoffee.com/abuzcoder");
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        onPress={openBMC}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png",
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    right: 20,
    zIndex: 9999, // Ensure it sits on top
  },
  button: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 150, // Standard BMC button size
    height: 40,
  },
});
