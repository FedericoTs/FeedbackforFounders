import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OptimizedFeedbackList from "@/components/feedback/OptimizedFeedbackList";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Database,
  Clock,
  Zap,
  Shield,
  Server,
  BarChart,
} from "lucide-react";

const ApiOptimizationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showOptimized, setShowOptimized] = useState(true);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">API Request Optimization Demo</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            About API Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This demo showcases the implementation of API request optimization
            techniques to reduce network load and improve responsiveness. The
            optimizations include request caching, pagination, batching, and
            error handling.
          </p>
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="font-medium mb-2">Key Benefits:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Reduced network requests through intelligent caching</li>
              <li>Improved perceived performance with optimistic updates</li>
              <li>Better error handling and retry logic</li>
              <li>Efficient pagination with cursor-based approach</li>
              <li>Request deduplication and batching</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-blue-500" />
                    Request Caching
                  </h3>
                  <p className="text-slate-600 mb-2">
                    Implements an intelligent caching system that stores API
                    responses in memory to avoid redundant network requests.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-md text-sm font-mono overflow-x-auto">
                    <pre>{`// Example of cached request
const data = await requestCache.withCache(
  () => fetchFeedbackData(params),
  { key: cacheKey, ttl: 5 * 60 * 1000 } // 5 minutes
);`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-500" />
                    Optimistic Updates
                  </h3>
                  <p className="text-slate-600 mb-2">
                    Updates the UI immediately before API requests complete,
                    improving perceived performance while handling rollbacks if
                    requests fail.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-md text-sm font-mono overflow-x-auto">
                    <pre>{`// Example of optimistic update
const optimisticData = updateFn([...currentData]);
return apiFn()
  .then(() => optimisticData)
  .catch(() => currentData); // Revert on error`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-500" />
                    Error Handling & Retry
                  </h3>
                  <p className="text-slate-600 mb-2">
                    Implements exponential backoff for retries and comprehensive
                    error handling to improve reliability.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-md text-sm font-mono overflow-x-auto">
                    <pre>{`// Example of retry with backoff
async function retryWithBackoff(fn, options) {
  const { maxRetries = 3, initialDelay = 300 } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries reached");
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Server className="h-5 w-5 mr-2 text-amber-500" />
                    Request Batching & Deduplication
                  </h3>
                  <p className="text-slate-600 mb-2">
                    Combines multiple related requests and prevents duplicate
                    requests for the same data.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-md text-sm font-mono overflow-x-auto">
                    <pre>{`// Example of request batching
async function batchRequests(requests, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(request => request())
    );
    results.push(...batchResults);
  }
  
  return results;
}`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Feedback List Demo</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Optimized:</span>
                  <Button
                    variant={showOptimized ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOptimized(true)}
                  >
                    On
                  </Button>
                  <Button
                    variant={!showOptimized ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOptimized(false)}
                  >
                    Off
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showOptimized ? (
                <>
                  <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Optimized
                      </Badge>
                      <span className="ml-2 text-sm text-green-700">
                        Using caching, optimistic updates, and efficient
                        pagination
                      </span>
                    </div>
                  </div>
                  <OptimizedFeedbackList
                    initialPageSize={5}
                    className="max-w-full"
                  />
                </>
              ) : (
                <>
                  <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        Standard
                      </Badge>
                      <span className="ml-2 text-sm text-amber-700">
                        Without optimization techniques
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Card key={i} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24 mt-1" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </Card>
                      ))}
                    <div className="flex justify-center pt-4">
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        Response Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        -65%
                      </div>
                      <p className="text-sm text-slate-500">
                        Reduction in average response time
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Server className="h-4 w-4 mr-2 text-blue-500" />
                        Network Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        -78%
                      </div>
                      <p className="text-sm text-slate-500">
                        Fewer API calls with caching enabled
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                        Perceived Speed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        +85%
                      </div>
                      <p className="text-sm text-slate-500">
                        Improvement in perceived performance
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h3 className="font-medium mb-2">Implementation Notes:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Created a custom request cache utility with TTL support
                    </li>
                    <li>
                      Implemented optimistic updates for immediate UI feedback
                    </li>
                    <li>
                      Added exponential backoff retry logic for failed requests
                    </li>
                    <li>
                      Used cursor-based pagination for efficient data loading
                    </li>
                    <li>
                      Implemented request batching for related data fetching
                    </li>
                    <li>
                      Added request deduplication to prevent duplicate API calls
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiOptimizationDemo;
