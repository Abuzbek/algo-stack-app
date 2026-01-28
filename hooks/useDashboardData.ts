import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Database } from "../types/database.types";

export type ScheduleItem =
  Database["public"]["Tables"]["user_schedule"]["Row"] & {
    questions: {
      question_frontend_id: number;
      title: string;
      difficulty: "Easy" | "Medium" | "Hard";
      title_slug: string;
      question_topics: {
        topics: {
          name: string;
          slug: string;
        } | null;
      }[];
    } | null;
  };

export const useTopics = () => {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*, question_topics(count)");
      if (error) throw error;

      return data
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          count: t.question_topics?.[0]?.count || 0,
        }))
        .sort((a: any, b: any) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useUserSchedule = (
  searchQuery: string,
  selectedTopic: string | null,
) => {
  return useInfiniteQuery({
    queryKey: ["user_schedule", searchQuery, selectedTopic],
    queryFn: async ({ pageParam = 0 }) => {
      const pageSize = 20;
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("user_schedule")
        .select(
          `
          *,
          questions!inner (
            title,
            difficulty,
            title_slug,
            question_frontend_id,
            question_topics (
              topics (
                name,
                slug,
                id
              )
            )
          )
        `,
          { count: "exact" },
        )
        .order("is_new", { ascending: true })
        .order("next_review_at", { ascending: true })
        .order("question_frontend_id", {
          foreignTable: "questions",
          ascending: true,
        })
        .range(from, to);

      if (selectedTopic) {
        // We need to modify the query to filter by topic. Does !inner work on nested?
        // Supabase JS allows filtering on nested relations if !inner is used.
        // But here question_topics is nested in questions.
        // To filter by topic, we might need to filter `questions` which has `question_topics` which has `topics`.
        // The Nuxt code re-constructs the query for filtering.
        query = supabase
          .from("user_schedule")
          .select(
            `
                    *,
                    questions!inner (
                        title,
                        difficulty,
                        title_slug,
                        question_frontend_id,
                        question_topics!inner (
                            topics!inner (
                                name,
                                slug,
                                id
                            )
                        )
                    )
                `,
            { count: "exact" },
          )
          .order("is_new", { ascending: true })
          .order("next_review_at", { ascending: true })
          .order("question_frontend_id", {
            foreignTable: "questions",
            ascending: true,
          })
          .range(from, to)
          .eq("questions.question_topics.topics.id", selectedTopic);
      }

      if (searchQuery) {
        const q = searchQuery.trim();
        const isNum = !isNaN(Number(q));
        if (isNum) {
          // .or on foreign tables is tricky in Supabase JS v2
          // The Nuxt code used: query.or(`title.ilike.%${q}%,question_frontend_id.eq.${q}`, { foreignTable: "questions" });
          query = query.or(`title.ilike.%${q}%,question_frontend_id.eq.${q}`, {
            foreignTable: "questions",
          });
        } else {
          query = query.ilike("questions.title", `%${q}%`);
        }
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return {
        data: (data as ScheduleItem[]) || [],
        count: count,
        nextPage: data?.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Database["public"]["Tables"]["user_schedule"]["Update"];
    }) => {
      const { error } = await supabase
        .from("user_schedule")
        .update(updates as never)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_schedule"] });
    },
  });
};
