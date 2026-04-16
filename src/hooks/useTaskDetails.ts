import { useEffect, useState } from "react";

import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";
import { buildCommentActivityDraft } from "@/lib/taskActivity";
import type { TaskActivity } from "@/types/activity";
import type { TaskComment } from "@/types/comment";

interface UseTaskDetailsState {
  activity: TaskActivity[];
  comments: TaskComment[];
  error: string | null;
  isCommenting: boolean;
  isLoading: boolean;
  mutationError: string | null;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  ) {
    return "Supabase is reachable, but the comment or activity tables are missing in this project. Run supabase/schema.sql in the Supabase SQL editor, then refresh.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return fallbackMessage;
}

export function useTaskDetails(taskId: string | null | undefined, enabled = true) {
  const [state, setState] = useState<UseTaskDetailsState>({
    activity: [],
    comments: [],
    error: null,
    isCommenting: false,
    isLoading: false,
    mutationError: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !taskId) {
      setState({
        activity: [],
        comments: [],
        error: null,
        isCommenting: false,
        isLoading: false,
        mutationError: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        activity: [],
        comments: [],
        error: SUPABASE_ENV_ERROR,
        isCommenting: false,
        isLoading: false,
        mutationError: null,
      });
      return;
    }

    const client = supabase;
    let isMounted = true;

    const loadDetails = async () => {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const [commentsResult, activityResult] = await Promise.all([
          client
            .from("comments")
            .select("*")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true }),
          client
            .from("task_activity")
            .select("*")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true }),
        ]);

        if (commentsResult.error) {
          throw commentsResult.error;
        }

        if (activityResult.error) {
          throw activityResult.error;
        }

        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          activity: activityResult.data ?? [],
          comments: commentsResult.data ?? [],
          error: null,
          isLoading: false,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          activity: [],
          comments: [],
          error: getErrorMessage(
            error,
            "Couldn't load the task conversation. Retry in a moment.",
          ),
          isLoading: false,
        }));
      }
    };

    void loadDetails();

    return () => {
      isMounted = false;
    };
  }, [attempt, enabled, taskId]);

  const createComment = async (options: {
    body: string;
    taskId: string;
    userId: string;
  }) => {
    const normalizedBody = options.body.trim();

    if (normalizedBody.length === 0) {
      const message = "Comment cannot be empty.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      throw new Error(message);
    }

    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const client = supabase;
    setState((currentState) => ({
      ...currentState,
      isCommenting: true,
      mutationError: null,
    }));

    try {
      const { data: nextComment, error: commentError } = await client
        .from("comments")
        .insert({
          body: normalizedBody,
          task_id: options.taskId,
          user_id: options.userId,
        })
        .select("*")
        .single();

      if (commentError) {
        throw commentError;
      }

      setState((currentState) => ({
        ...currentState,
        comments: [...currentState.comments, nextComment],
      }));

      const { data: nextActivity, error: activityError } = await client
        .from("task_activity")
        .insert(buildCommentActivityDraft({
          actorUserId: options.userId,
          body: normalizedBody,
          taskId: options.taskId,
        }))
        .select("*")
        .single();

      if (activityError) {
        setState((currentState) => ({
          ...currentState,
          isCommenting: false,
          mutationError:
            "Comment saved, but activity couldn't be recorded cleanly. Refresh to verify the timeline.",
        }));

        return nextComment;
      }

      setState((currentState) => ({
        ...currentState,
        activity: [...currentState.activity, nextActivity],
        isCommenting: false,
      }));

      return nextComment;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't add the comment. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isCommenting: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  return {
    ...state,
    clearMutationError: () =>
      setState((currentState) => ({
        ...currentState,
        mutationError: null,
      })),
    createComment,
    refetch: async () => {
      setAttempt((currentAttempt) => currentAttempt + 1);
    },
  };
}
