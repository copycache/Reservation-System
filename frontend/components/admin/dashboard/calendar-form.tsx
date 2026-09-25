import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BookingSlot = {
  date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  booking?: {
    status?: string;
    customers?: {
      name?: string;
    } | null;
  } | null;
};

type CalendarFormProps = {
  selectedSlot: BookingSlot | null;
  onClose: () => void;
};

export function CalendarForm({
  selectedSlot,
  onClose,
}: CalendarFormProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Time Slot</DialogTitle>
      </DialogHeader>

      asd
    </DialogContent>
  );
}