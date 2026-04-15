import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { getCurrentSession, signInAsGuest } from "@/lib/auth";
import { getGuestAvatarColor, getGuestCode } from "@/lib/utils";
import { SUPABASE_ENV_ERROR, supabase } from "@/lib/supabase";

interface GuestSessionState {
  error: string | null;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
}

export function useGuestSession() {
  const [state, setState] = useState<GuestSessionState>({
    error: null,
    isLoading: true,
    session: null,
    user: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setState({
        error: SUPABASE_ENV_ERROR,
        isLoading: false,
        session: null,
        user: null,
      });
      return;
    }

    const client = supabase;
    let isMounted = true;
    let isBootstrapping = true;

    const ensureWorkspaceProfile = async (user: User) => {
      const { error } = await client.from("workspace_profiles").upsert(
        {
          avatar_color: getGuestAvatarColor(user.id),
          guest_code: getGuestCode(user.id),
          user_id: user.id,
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        const code =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : null;

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "";

        if (
          code === "PGRST205" ||
          code === "42P01" ||
          message.toLowerCase().includes("workspace_profiles")
        ) {
          return;
        }

        throw error;
      }
    };

    const bootstrapGuestSession = async () => {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const {
          data: { session: existingSession },
          error: sessionError,
        } = await getCurrentSession();

        if (sessionError) {
          throw sessionError;
        }

        if (existingSession?.user) {
          await ensureWorkspaceProfile(existingSession.user);

          if (!isMounted) {
            return;
          }

          setState({
            error: null,
            isLoading: false,
            session: existingSession,
            user: existingSession.user,
          });

          return;
        }

        const {
          data: { session: anonymousSession },
          error: signInError,
        } = await signInAsGuest();

        if (signInError) {
          throw signInError;
        }

        if (!anonymousSession?.user) {
          throw new Error(
            "Guest authentication completed without a valid user session.",
          );
        }

        await ensureWorkspaceProfile(anonymousSession.user);

        if (!isMounted) {
          return;
        }

        setState({
          error: null,
          isLoading: false,
          session: anonymousSession,
          user: anonymousSession?.user ?? null,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          error:
            error instanceof Error
              ? error.message
              : "Couldn't start the guest workspace. Retry in a moment.",
          isLoading: false,
          session: null,
          user: null,
        });
      } finally {
        isBootstrapping = false;
      }
    };

    void bootstrapGuestSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (isBootstrapping && !session?.user) {
        return;
      }

      setState((currentState) => ({
        error: session?.user ? null : currentState.error,
        isLoading: false,
        session,
        user: session?.user ?? null,
      }));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [attempt]);

  return {
    ...state,
    retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
  };
}
