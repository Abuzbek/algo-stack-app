import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Database } from "../types/database.types";

const PAGE_SIZE = 30;

export const useStudyLists = () => {
  return useQuery({
    queryKey: ["study_lists"],
    queryFn: async () => {
      // @ts-ignore - study_lists table not in types yet
      const { data, error } = await supabase
        .from("study_lists")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching study lists:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useTrackedQuestions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["tracked_questions", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase
        .from("user_schedule")
        .select("question_id")
        .eq("user_id", userId);

      if (error) throw error; // React Query handles error via boundary or onError
      return new Set(data?.map((item: any) => item.question_id) || []);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};

export const useQuestions = (
  searchQuery: string,
  topicId: string | null,
  studyListId: string | null,
) => {
  return useInfiniteQuery({
    queryKey: ["questions", searchQuery, topicId, studyListId],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let currentBatch: any[] = [];
      let count: number | null = null;

      try {
        let dbQuery = supabase
          .from("questions")
          .select("*, topics!inner(*)", { count: "exact" })
          .order("question_frontend_id", { ascending: true })
          .range(from, to);

        // Apply Study List Filter
        if (studyListId) {
          dbQuery = supabase
            .from("questions")
            .select("*, topics(*), question_study_lists!inner(study_list_id)", {
              count: "exact",
            })
            .eq("question_study_lists.study_list_id", studyListId)
            .order("question_frontend_id", { ascending: true })
            .range(from, to);
        } else {
          // If no study list, use the initial query which already selects topics!inner
          // But wait, the Vue code uses `topics(*)` (left join) when no filter,
          // and `topics!inner(*)` (inner join) when filtering by topic.
          // Let's match the Vue logic carefully.

          // Vue Logic:
          // Initial: select("*, topics!inner(*)") <-- Wait, Vue code says `topics!inner(*)` initially?
          // Ah, checking Vue code:
          // let dbQuery = client.from("questions").select("*, topics!inner(*)", ...);
          // Apply Study List Filter: if (listId) { ... select("*, topics(*), question_study_lists!inner ...") }
          // else { dbQuery = client.from("questions").select("*, topics(*)", ...) } <-- Vue actually resets it to left join if no listId?
          // Actually, let's look at the Vue code logic block for "else { dbQuery = client... select("*, topics(*)") }"
          // Yes, if NO listId, it changes to topics(*) which is left join.

          if (!studyListId) {
            dbQuery = supabase
              .from("questions")
              .select("*, topics(*)", { count: "exact" })
              .order("question_frontend_id", { ascending: true })
              .range(from, to);
          }
        }

        if (topicId) {
          if (studyListId) {
            dbQuery = supabase
              .from("questions")
              .select(
                "*, topics!inner(*), question_study_lists!inner(study_list_id)",
                { count: "exact" },
              )
              .eq("question_study_lists.study_list_id", studyListId)
              .eq("topics.id", topicId);
          } else {
            dbQuery = supabase
              .from("questions")
              .select("*, topics!inner(*)", { count: "exact" })
              .eq("topics.id", topicId);
          }

          dbQuery = dbQuery
            .range(from, to)
            .order("question_frontend_id", { ascending: true });
        }

        // Apply Search
        if (searchQuery) {
          const q = searchQuery.trim();
          const isNum = !isNaN(Number(q));

          if (isNum) {
            if (studyListId || topicId) {
              dbQuery = dbQuery.or(
                `question_frontend_id.eq.${q},title.ilike.%${q}%`,
              );
            } else {
              dbQuery = supabase
                .from("questions")
                .select("*, topics(*)", { count: "exact" })
                .or(`question_frontend_id.eq.${q}`)
                .range(from, to);

              if (studyListId) {
                dbQuery = dbQuery
                  .select(
                    "*, topics(*), question_study_lists!inner(study_list_id)",
                  )
                  .eq("question_study_lists.study_list_id", studyListId);
              }
            }
          } else {
            if (topicId) {
              dbQuery = dbQuery.ilike("title", `%${q}%`);
            } else {
              // RPC search
              const rpcParams: any = {
                search_term: q,
                similarity_threshold: 0.1,
              };

              // Note: The RPC error "Could not choose the best candidate function" likely happened because
              // we were passing `filter_study_list_id` optionally, matching a signature that might not exist
              // or conflicting with another.
              // In the Vue code:
              // const rpcParams: any = { search_term: q, similarity_threshold: 0.1 };
              // const res = await client.rpc("search_questions", rpcParams, ...)
              // It seems the Vue code does NOT pass filter_study_list_id to the RPC?
              // Let's re-read the Vue code provided.
              // ...
              // const rpcParams: any = { search_term: q, similarity_threshold: 0.1 };
              // const res = await client.rpc("search_questions", rpcParams, { count: "exact" }).range(from, to);
              // ...
              // Correct, the Vue code DOES NOT include filter_study_list_id in rpcParams!
              // That explains why the previous version (which did pass it) might have failed if the RPC didn't expect it,
              // OR if it caused an ambiguous overload match.
              // So we will follow the Vue implementation exactly and verify if it works.

              const {
                data: searchResults,
                count: c,
                error,
              } = await supabase
                .rpc("search_questions", rpcParams, { count: "exact" })
                .range(from, to);

              if (error) throw error;

              if (!searchResults || (searchResults as any[]).length === 0) {
                return {
                  questions: [],
                  count: c,
                  nextPage: undefined,
                };
              }

              // Hydrate topics
              const questionIds = (searchResults as any[]).map(
                (q: any) => q.id,
              );
              const { data: topicsData } = await supabase
                .from("question_topics")
                .select("question_id, topics(*)")
                .in("question_id", questionIds);

              currentBatch = (searchResults as any[]).map((q: any) => {
                const relevantTopics =
                  topicsData
                    ?.filter((t: any) => t.question_id === q.id)
                    .map((t: any) => t.topics) || [];
                return { ...q, topics: relevantTopics };
              });

              return {
                questions: currentBatch,
                count: c,
                nextPage:
                  currentBatch.length === PAGE_SIZE ? pageParam + 1 : undefined,
              };
            }
          }
        }

        const { data: d, count: c, error } = await dbQuery;
        if (error) throw error;

        currentBatch = d || [];
        count = c;

        return {
          questions: currentBatch,
          count: c,
          nextPage:
            currentBatch.length === PAGE_SIZE ? pageParam + 1 : undefined,
        };
      } catch (e) {
        console.error("Error loading questions:", e);
        throw e;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

export const useTrackQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      questionId,
    }: {
      userId: string;
      questionId: string;
    }) => {
      const insertData: Database["public"]["Tables"]["user_schedule"]["Insert"] =
        {
          user_id: userId,
          question_id: questionId,
          status: "new",
          next_review_at: new Date().toISOString(),
          interval_days: 0,
          ease_factor: 2.5,
        };

      const { error } = await supabase
        .from("user_schedule")
        .upsert(insertData as never, { onConflict: "user_id, question_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_questions"] });
      // Should also invalidate schedule?
      queryClient.invalidateQueries({ queryKey: ["user_schedule"] });
    },
  });
};

export const useTrackStudyList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      studyListId,
    }: {
      userId: string;
      studyListId: string;
    }) => {
      const { error } = await supabase.rpc("track_study_list", {
        p_user_id: userId,
        p_study_list_id: studyListId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_questions"] });
      queryClient.invalidateQueries({ queryKey: ["user_schedule"] });
    },
  });
};
