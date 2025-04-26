import React from "react";
import { Spinner } from "./spinner";

interface LoadingPageProps {
  message?: string;
  className?: string;
}

export function LoadingPage({
  message = "Loading...",
  className = "",
}: LoadingPageProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-screen ${className}`}
    >
      <Spinner className="h-8 w-8 text-teal-500 mb-2" />
      <span className="text-slate-600">{message}</span>
    </div>
  );
}

export function LoadingSection({
  message = "Loading...",
  className = "",
}: LoadingPageProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-64 ${className}`}
    >
      <Spinner className="h-6 w-6 text-teal-500 mb-2" />
      <span className="text-slate-600 text-sm">{message}</span>
    </div>
  );
}
