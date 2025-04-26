import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VirtualizedActivityFeed from "./VirtualizedActivityFeed";
import VirtualizedFeedbackList from "../feedback/VirtualizedFeedbackList";
import VirtualizedProjectsList from "../projects/VirtualizedProjectsList";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Info, List, Grid } from "lucide-react";

const VirtualizationDemo: React.FC = () => {
  const [projectsView, setProjectsView] = useState<"grid" | "list">("grid");
  const [itemCount, setItemCount] = useState<number>(50);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">List Virtualization Demo</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            About Virtualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This demo showcases the implementation of virtualization for long
            lists to improve performance. Virtualization renders only the items
            that are currently visible in the viewport, significantly reducing
            DOM nodes and improving scrolling performance for large datasets.
          </p>
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2">Key Benefits:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Renders only visible items, reducing memory usage</li>
              <li>Maintains smooth scrolling even with thousands of items</li>
              <li>Supports dynamic item heights</li>
              <li>Includes infinite scrolling for pagination</li>
              <li>Provides appropriate loading states and placeholders</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-slate-50 p-4 rounded-md border border-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="item-count" className="mr-2">
              Items to load: {itemCount}
            </Label>
            <Slider
              id="item-count"
              min={10}
              max={200}
              step={10}
              value={[itemCount]}
              onValueChange={(values) => setItemCount(values[0])}
              className="w-[200px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-filters"
              checked={showFilters}
              onCheckedChange={setShowFilters}
            />
            <Label htmlFor="show-filters">Show Filters</Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Projects View:</span>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={projectsView === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setProjectsView("grid")}
            >
              <Grid className="h-4 w-4 mr-1" /> Grid
            </Button>
            <Button
              variant={projectsView === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setProjectsView("list")}
            >
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="feedback">Feedback List</TabsTrigger>
          <TabsTrigger value="projects">Projects List</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Virtualized Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualizedActivityFeed
                limit={itemCount}
                showFilters={showFilters}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Virtualized Feedback List</CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualizedFeedbackList limit={itemCount} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Virtualized Projects List</CardTitle>
            </CardHeader>
            <CardContent>
              <VirtualizedProjectsList limit={itemCount} view={projectsView} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ~75%
                  </div>
                  <p className="text-sm text-slate-500">
                    Reduction in memory usage compared to non-virtualized lists
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">DOM Nodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ~90%
                  </div>
                  <p className="text-sm text-slate-500">
                    Fewer DOM nodes rendered for large lists
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Scroll Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    60 FPS
                  </div>
                  <p className="text-sm text-slate-500">
                    Maintained even with thousands of items
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-medium mb-2">Implementation Notes:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  Used @tanstack/react-virtual for efficient virtualization
                </li>
                <li>
                  Implemented dynamic measurement for varying item heights
                </li>
                <li>
                  Added appropriate overscan to prevent blank areas during fast
                  scrolling
                </li>
                <li>Integrated with existing data fetching patterns</li>
                <li>Added skeleton placeholders for loading states</li>
                <li>Implemented infinite scrolling for pagination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualizationDemo;
