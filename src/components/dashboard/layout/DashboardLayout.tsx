import React, { useState, useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize search query from URL params if present
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Update URL search params
    if (query) {
      setSearchParams({ q: query });
    } else {
      // Remove the search param if query is empty
      searchParams.delete("q");
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFBFF] dark:bg-slate-900 relative">
      {/* Mobile menu button - only visible on small screens */}
      {isMobileView && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar - hidden by default on mobile, shown when menu is open */}
      <div
        className={`${isMobileMenuOpen ? "block" : "hidden"} md:block fixed inset-0 z-40 md:relative md:z-auto`}
      >
        <div
          className="absolute inset-0 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="relative z-10 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileView={isMobileView}
          onSearch={handleSearch}
          searchValue={searchQuery}
        />
        <main className="flex-1 overflow-y-auto pt-16 px-4 sm:px-6 pb-6">
          {/* Pass search query to child components via context or props if needed */}
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
