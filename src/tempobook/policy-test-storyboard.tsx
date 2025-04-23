import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projectService } from "@/services/project";

const PolicyTestStoryboard = () => {
  const [projectsData, setProjectsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projects = await projectService.fetchProjects({
        filter: "all",
      });
      setProjectsData(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Policy Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={fetchProjects}
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? "Fetching..." : "Fetch Projects"}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <h3 className="font-semibold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {projectsData && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                Projects Data{" "}
                <Badge className="bg-blue-100 text-blue-800">
                  {projectsData.length} projects
                </Badge>
              </h3>
              <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(projectsData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyTestStoryboard;
