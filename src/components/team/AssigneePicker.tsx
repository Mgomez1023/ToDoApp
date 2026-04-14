import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface AssigneePickerProps {
  disabled?: boolean;
}

export function AssigneePicker({ disabled = false }: AssigneePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={disabled} type="button" variant="secondary">
        <UserPlus className="size-4" />
        Add assignee
      </Button>
    </div>
  );
}
