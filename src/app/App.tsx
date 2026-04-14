import { Users } from "lucide-react";
import { useState } from "react";

import { Board } from "@/components/board/Board";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/Button";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import type { AssigneeFilter, TaskPriorityFilter } from "@/types/task";

export function App() {
  const guestSession = useGuestSession();
  const tasks = useTasks(guestSession.user?.id);
  const teamMembers = useTeamMembers(guestSession.user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState<TaskPriorityFilter>("all");
  const [assigneeId, setAssigneeId] = useState<AssigneeFilter>("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <>
      <div className="relative isolate min-h-screen overflow-hidden bg-canvas text-ink">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.08),_transparent_30%)]" />

        <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-end">
            <Button
              className="hidden sm:inline-flex"
              size="sm"
              type="button"
              variant="ghost"
            >
              <Users className="size-4" />
              Team setup in Phase 6
            </Button>
          </div>

          <Board
            filters={{
              assigneeId,
              priority,
              searchQuery,
            }}
            guestUserId={guestSession.user?.id ?? null}
            isLoading={guestSession.isLoading || tasks.isLoading}
            members={teamMembers.members}
            onAssigneeChange={setAssigneeId}
            onCreateTask={() => setIsTaskModalOpen(true)}
            onPriorityChange={setPriority}
            onRetry={guestSession.retry}
            onSearchChange={setSearchQuery}
            sessionError={guestSession.error}
            tasks={tasks.tasks}
            taskError={tasks.error}
          />
        </main>
      </div>

      <TaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </>
  );
}
