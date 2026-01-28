import GoogleIcon from "@/components/icons/GoogleIcon";
import { makeRedirectUri } from "expo-auth-session";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession(); // Handle web redirect

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle deep link when app is opened from auth
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const createSessionFromUrl = async (url: string) => {
        try {
          // Parse the URL to get the access_token and refresh_token
          // Supabase redirects to: scheme://auth/callback#access_token=...&refresh_token=...
          // or scheme://auth/callback?access_token=...
          // We can let Supabase handle it if we extract the fragment

          // Simple parsing:
          const params = Linking.parse(url);
          // Note: In some setups Supabase sends tokens in hash, expo-linking puts them in queryParams or path
          // If we use implicit flow, tokens are in hash.
          // However, simpler is to just let the session refresh naturally or use setSession if we have the tokens.

          // For now, let's assume the session is handled by Supabase JS automatically if the URL is passed correctly?
          // Actually no, React Native Supabase implementation usually needs manual session setting for deep links if "detectSessionInUrl" is false.
          // But we set "detectSessionInUrl: false" in client setup to avoid issues.

          // Let's rely on the OAuth flow returning the session via the result of openAuthSessionAsync if possible,
          // OR manually parsing the URL.
        } catch (e) {
          console.error("Error parsing URL", e);
        }
      };
      createSessionFromUrl(url);
    }
  }, [url]);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const redirectUrl = makeRedirectUri({
        scheme: "algostack",
      });
      console.log(redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );

        if (result.type === "success" && result.url) {
          // Extract tokens from the URL
          // Supabase returns tokens in the hash (fragment)
          // e.g. ...#access_token=...&refresh_token=...
          const parsed = Linking.parse(result.url);
          // Expo Linking parse might put hash params in queryParams depending on format,
          // but often they end up in null if it's a hash. We might need manual regex.

          // Regex to find access_token and refresh_token
          const accessTokenMatch = result.url.match(/access_token=([^&]+)/);
          const refreshTokenMatch = result.url.match(/refresh_token=([^&]+)/);

          if (accessTokenMatch && refreshTokenMatch) {
            const access_token = accessTokenMatch[1];
            const refresh_token = refreshTokenMatch[1];

            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#334155"]} // Slate 900 -> 800 -> 700
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Decorative Blobs */}
      <View className="absolute top-[-100] left-[-100] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50" />
      <View className="absolute bottom-[-100] right-[-100] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50" />

      <View className="flex-1 justify-center items-center p-6">
        {/* Brand */}
        <View className="items-center mb-10">
          <Image
            source={require("../assets/images/favicon.svg")}
            style={{
              width: 80,
              height: 80,
              marginBottom: 16,
              borderRadius: 16,
            }}
          />
          <Text className="text-4xl font-bold text-white tracking-tight">
            AlgoStack
          </Text>
          <Text className="text-indigo-200 mt-2 text-center text-lg">
            Master LeetCode with Spaced Repetition
          </Text>
        </View>

        {/* Login Card */}
        <BlurView
          intensity={Platform.OS === "ios" ? 30 : 100}
          tint="dark"
          className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/10"
        >
          <View className="p-8 gap-5 bg-white/5">
            <Text className="text-2xl font-bold text-center text-white mb-2">
              Welcome
            </Text>

            {/* Google Login Button */}
            <TouchableOpacity
              onPress={signInWithGoogle}
              activeOpacity={0.8}
              className="flex-row items-center justify-center bg-white h-12 rounded-xl mb-4"
            >
              <GoogleIcon />
              <Text className="text-lg font-bold text-gray-900 ml-2">
                Sign in with Google
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <Text className="text-white/30 text-xs mt-8 text-center px-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}
