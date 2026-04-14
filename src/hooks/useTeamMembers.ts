import { useEffect, useState } from "react";

import type { TeamMember } from "@/types/team";

export function useTeamMembers(userId: string | null | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setMembers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Phase 6 will hydrate lightweight team members for the active guest user.
    setMembers([]);
    setError(null);
    setIsLoading(false);
  }, [userId]);

  return {
    error,
    isLoading,
    members,
    refetch: async () => undefined,
    setMembers,
  };
}
