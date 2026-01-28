import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../components/AuthProvider";

export function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!session && inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace("/login");
    } else if (session && segments[0] === "login") {
      // Redirect away from the sign-in page.
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);
}
