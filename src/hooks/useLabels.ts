import { useEffect, useMemo, useState } from "react";

import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";
import type { Label, LabelDraft } from "@/types/label";

interface UseLabelsState {
  error: string | null;
  isCreating: boolean;
  isLoading: boolean;
  labels: Label[];
  mutationError: string | null;
}

function sortLabels(labels: Label[]) {
  return [...labels].sort((leftLabel, rightLabel) =>
    leftLabel.name.localeCompare(rightLabel.name),
  );
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  ) {
    return "Supabase is reachable, but the label tables are missing in this project. Run supabase/schema.sql in the Supabase SQL editor, then refresh.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "That label name already exists in this workspace.";
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

async function requireAuthenticatedUserId() {
  if (!supabase) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Guest workspace is still starting. Refresh and try again.");
  }

  return user.id;
}

export function useLabels(userId: string | null | undefined) {
  const [state, setState] = useState<UseLabelsState>({
    error: null,
    isCreating: false,
    isLoading: false,
    labels: [],
    mutationError: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setState({
        error: null,
        isCreating: false,
        isLoading: false,
        labels: [],
        mutationError: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        error: SUPABASE_ENV_ERROR,
        isCreating: false,
        isLoading: false,
        labels: [],
        mutationError: null,
      });
      return;
    }

    const client = supabase;
    let isMounted = true;

    const loadLabels = async () => {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const { data, error } = await client
          .from("labels")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: null,
          isLoading: false,
          labels: sortLabels(data ?? []),
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: getErrorMessage(
            error,
            "Couldn't load labels for this workspace. Retry in a moment.",
          ),
          isLoading: false,
          labels: [],
        }));
      }
    };

    void loadLabels();

    return () => {
      isMounted = false;
    };
  }, [attempt, userId]);

  const ownedLabels = useMemo(
    () => state.labels.filter((label) => label.user_id === userId),
    [state.labels, userId],
  );

  const createLabel = async (input: Pick<LabelDraft, "color" | "name">) => {
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
      isCreating: true,
      mutationError: null,
    }));

    try {
      const authenticatedUserId = await requireAuthenticatedUserId();
      const normalizedName = input.name.trim();

      const { error } = await client
        .from("labels")
        .insert({
          color: input.color,
          name: normalizedName,
          user_id: authenticatedUserId,
        });

      if (error) {
        throw error;
      }

      const { data, error: selectError } = await client
        .from("labels")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .eq("name", normalizedName)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (selectError) {
        throw selectError;
      }

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        labels: sortLabels([...currentState.labels, data]),
      }));

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't create the label. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
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
    createLabel,
    ownedLabels,
    refetch: async () => {
      setAttempt((currentAttempt) => currentAttempt + 1);
    },
  };
}
