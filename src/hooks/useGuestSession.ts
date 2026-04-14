import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { getCurrentSession, signInAsGuest } from "@/lib/auth";
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

    let isMounted = true;

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

        if (existingSession) {
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
      }
    };

    void bootstrapGuestSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setState({
        error: null,
        isLoading: false,
        session,
        user: session?.user ?? null,
      });
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
