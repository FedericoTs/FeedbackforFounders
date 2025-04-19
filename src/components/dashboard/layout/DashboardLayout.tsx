import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-[#FAFBFF] dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-y-auto pt-16 px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
