import { Clock } from "lucide-react";
import type { AppointmentWithPatient } from "../types";
import { statusColors, statusDot } from "../types";

interface AppointmentCardProps {
  appointment: AppointmentWithPatient;
  variant?: "compact" | "full";
  onClick?: () => void;
}

export function AppointmentCard({ appointment, variant = "compact", onClick }: AppointmentCardProps) {
  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-2.5 py-2 rounded-lg border text-[11px] transition-all hover:shadow-sm ${statusColors[appointment.status] || statusColors.PLANNED}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[appointment.status] || statusDot.PLANNED}`} />
          <span className="truncate">{appointment.patientName}</span>
        </div>
        <span className="opacity-70 ml-3">{appointment.startTimeStr}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all hover:shadow-md ${statusColors[appointment.status] || statusColors.PLANNED}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDot[appointment.status] || statusDot.PLANNED}`} />
          {appointment.patientName}
        </span>
        <span className="text-[12px] opacity-70">
          {appointment.startTimeStr} - {appointment.endTimeStr}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-[12px] opacity-70 ml-4">
        <Clock className="w-3 h-3" />
        <span>45 min</span>
        <span className="mx-1">·</span>
        <span className="capitalize">{appointment.status.toLowerCase()}</span>
      </div>
    </button>
  );
}
