import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Star, Plus } from "lucide-react";

interface FeedbackUser {
  name: string;
  avatar: string;
  level: number;
}

interface FeedbackPointProps {
  id: string;
  coordinates: { x: number; y: number };
  isActive: boolean;
  isNew?: boolean;
  user?: FeedbackUser;
  content?: string;
  rating?: number;
  pointsEarned?: number;
  element?: string;
  onClick: () => void;
}

export function PointingTool({
  id,
  coordinates,
  isActive,
  isNew = false,
  user,
  content,
  rating = 0,
  pointsEarned = 0,
  element = "",
  onClick,
}: FeedbackPointProps) {
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${isActive ? "z-20" : "z-10"}`}
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
      }}
      onClick={onClick}
    >
      {isNew ? (
        <div className="h-6 w-6 rounded-full bg-teal-500 text-white flex items-center justify-center animate-pulse">
          <Plus className="h-4 w-4" />
        </div>
      ) : (
        <div
          className={`h-6 w-6 rounded-full flex items-center justify-center ${isActive ? "bg-teal-500 text-white" : "bg-white border-2 border-teal-500 text-teal-500"}`}
        >
          {id.replace(/\D/g, "")}
        </div>
      )}

      {isActive && user && (
        <div className="absolute top-8 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-3 z-30 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
              />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-xs font-medium text-slate-900 dark:text-white">
              {user.name}
            </div>
            <div className="ml-auto flex">
              {Array.from({ length: rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          {content && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {content}
            </p>
          )}
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-500">
            <span>{element}</span>
            <span>+{pointsEarned} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
