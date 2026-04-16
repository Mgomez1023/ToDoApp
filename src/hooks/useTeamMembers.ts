import { useEffect, useMemo, useState } from "react";

import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";
import type { TeamMember, TeamMemberDraft, WorkspaceProfile } from "@/types/team";

interface UseTeamMembersState {
  deletingMemberId: string | null;
  error: string | null;
  isCreating: boolean;
  isLinking: boolean;
  isLoading: boolean;
  members: TeamMember[];
  mutationError: string | null;
}

function sortMembers(members: TeamMember[]) {
  return [...members].sort(
    (leftMember, rightMember) =>
      new Date(leftMember.created_at).getTime() -
      new Date(rightMember.created_at).getTime(),
  );
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  ) {
    return "Supabase is reachable, but the team member collaboration tables are missing in this project. Run supabase/schema.sql in the Supabase SQL editor, then refresh.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "That guest is already on this team.";
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

export function useTeamMembers(userId: string | null | undefined) {
  const [state, setState] = useState<UseTeamMembersState>({
    deletingMemberId: null,
    error: null,
    isCreating: false,
    isLinking: false,
    isLoading: false,
    members: [],
    mutationError: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setState({
        deletingMemberId: null,
        error: null,
        isCreating: false,
        isLinking: false,
        isLoading: false,
        members: [],
        mutationError: null,
      });
      return;
    }

    if (!supabase) {
      setState({
        deletingMemberId: null,
        error: SUPABASE_ENV_ERROR,
        isCreating: false,
        isLinking: false,
        isLoading: false,
        members: [],
        mutationError: null,
      });
      return;
    }

    const client = supabase;
    let isMounted = true;

    const loadMembers = async () => {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const { data, error } = await client
          .from("team_members")
          .select("*")
          .order("created_at", { ascending: true });

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
          members: sortMembers(data ?? []),
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: getErrorMessage(
            error,
            "Couldn't load team members for this workspace. Retry in a moment.",
          ),
          isLoading: false,
          members: [],
        }));
      }
    };

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [attempt, userId]);

  const ownedMembers = useMemo(
    () => state.members.filter((member) => member.user_id === userId),
    [state.members, userId],
  );

  const createMember = async (
    input: Pick<TeamMemberDraft, "avatar_color" | "name">,
  ) => {
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

      const { data, error } = await client
        .from("team_members")
        .insert({
          ...input,
          name: input.name.trim(),
          user_id: authenticatedUserId,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        members: sortMembers([...currentState.members, data]),
      }));

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't create the team member. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isCreating: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  const linkGuestMember = async (guestCode: string) => {
    if (!supabase) {
      setState((currentState) => ({
        ...currentState,
        mutationError: SUPABASE_ENV_ERROR,
      }));
      throw new Error(SUPABASE_ENV_ERROR);
    }

    const normalizedGuestCode = guestCode.trim().toUpperCase();

    if (normalizedGuestCode.length === 0) {
      const message = "Guest code is required.";
      setState((currentState) => ({
        ...currentState,
        mutationError: message,
      }));
      throw new Error(message);
    }

    const client = supabase;
    setState((currentState) => ({
      ...currentState,
      isLinking: true,
      mutationError: null,
    }));

    try {
      const authenticatedUserId = await requireAuthenticatedUserId();

      const { data, error } = await client.rpc("find_workspace_profile", {
        lookup_guest_code: normalizedGuestCode,
      });

      if (error) {
        throw error;
      }

      const profile = (data?.[0] ?? null) as WorkspaceProfile | null;

      if (!profile) {
        throw new Error("No guest workspace matches that code yet.");
      }

      if (profile.user_id === authenticatedUserId) {
        throw new Error("You cannot add your own guest workspace as a linked teammate.");
      }

      const alreadyLinked = ownedMembers.some(
        (member) => member.linked_user_id === profile.user_id,
      );

      if (alreadyLinked) {
        throw new Error("That guest is already on this team.");
      }

      const { data: nextMember, error: insertError } = await client
        .from("team_members")
        .insert({
          avatar_color: profile.avatar_color,
          linked_user_id: profile.user_id,
          name: `Guest ${profile.guest_code}`,
          user_id: authenticatedUserId,
        })
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      setState((currentState) => ({
        ...currentState,
        isLinking: false,
        members: sortMembers([...currentState.members, nextMember]),
      }));

      return nextMember;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't add that guest to the team. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        isLinking: false,
        mutationError: message,
      }));

      throw new Error(message);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!userId) {
      const message = "Guest workspace is still starting. Try again in a moment.";
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
      deletingMemberId: memberId,
      mutationError: null,
    }));

    try {
      const { error } = await client
        .from("team_members")
        .delete()
        .eq("id", memberId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setState((currentState) => ({
        ...currentState,
        deletingMemberId: null,
        members: currentState.members.filter((member) => member.id !== memberId),
      }));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Couldn't remove the team member. Try again in a moment.",
      );

      setState((currentState) => ({
        ...currentState,
        deletingMemberId: null,
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
    createMember,
    deleteMember,
    linkGuestMember,
    ownedMembers,
    refetch: async () => {
      setAttempt((currentAttempt) => currentAttempt + 1);
    },
  };
}
