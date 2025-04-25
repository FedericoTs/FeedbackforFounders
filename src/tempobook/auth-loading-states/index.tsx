import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AuthSkeleton } from "@/components/ui/auth-skeleton";
import { AuthLoading } from "@/components/ui/auth-loading";

export default function AuthLoadingStatesStoryboard() {
  const [activeTab, setActiveTab] = React.useState("skeletons");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Auth Loading States Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This storyboard demonstrates the skeleton loaders and loading states
            for authentication-dependent UI.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="skeletons">Skeleton Loaders</TabsTrigger>
          <TabsTrigger value="loading">Loading Indicators</TabsTrigger>
        </TabsList>

        <TabsContent value="skeletons">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Skeletons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Default</h3>
                    <AuthSkeleton />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Multiple Items</h3>
                    <AuthSkeleton count={3} height="h-10" />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Circle</h3>
                    <div className="flex space-x-2">
                      <AuthSkeleton circle width="w-12" height="h-12" />
                      <AuthSkeleton circle width="w-12" height="h-12" />
                      <AuthSkeleton circle width="w-12" height="h-12" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Complex Skeletons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Card Skeleton</h3>
                    <AuthSkeleton card />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Form Skeleton</h3>
                    <AuthSkeleton form />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Avatar</h3>
                    <div className="flex space-x-2">
                      <AuthSkeleton avatar width="w-10" height="h-10" />
                      <div className="flex-1">
                        <AuthSkeleton height="h-4" className="mb-2" />
                        <AuthSkeleton height="h-3" width="w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-md p-4 flex items-center justify-center h-32">
                    <AuthLoading
                      size="md"
                      variant="primary"
                      text="Verifying your credentials..."
                      centered={true}
                    />
                  </div>

                  <div className="border rounded-md p-4 flex items-center justify-center h-32">
                    <AuthLoading
                      size="md"
                      variant="secondary"
                      type="dots"
                      text="Checking permissions..."
                      centered={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-4">
                      Profile Loading
                    </h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <AuthSkeleton avatar width="w-12" height="h-12" />
                      <div className="flex-1">
                        <AuthSkeleton height="h-4" className="mb-2" />
                        <AuthSkeleton height="h-3" width="w-2/3" />
                      </div>
                    </div>
                    <AuthSkeleton count={3} height="h-8" />
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-4">
                      Dashboard Loading
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <AuthSkeleton height="h-20" />
                      <AuthSkeleton height="h-20" />
                    </div>
                    <AuthSkeleton count={2} height="h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Real-World Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Loading State</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <AuthSkeleton avatar width="w-16" height="h-16" />
                  <div className="flex-1">
                    <AuthSkeleton height="h-5" className="mb-2" />
                    <AuthSkeleton height="h-4" width="w-2/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <AuthSkeleton height="h-4" width="w-1/2" className="mb-2" />
                    <AuthSkeleton height="h-8" />
                  </div>
                  <div>
                    <AuthSkeleton height="h-4" width="w-1/2" className="mb-2" />
                    <AuthSkeleton height="h-8" />
                  </div>
                </div>
                <AuthSkeleton height="h-4" width="w-1/3" className="mb-2" />
                <AuthSkeleton height="h-24" />
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Dashboard Loading State</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <AuthSkeleton height="h-24" />
                  <AuthSkeleton height="h-24" />
                  <AuthSkeleton height="h-24" />
                </div>
                <div className="flex space-x-4 mb-4">
                  <div className="w-2/3">
                    <AuthSkeleton height="h-4" width="w-1/3" className="mb-2" />
                    <AuthSkeleton height="h-40" />
                  </div>
                  <div className="w-1/3">
                    <AuthSkeleton height="h-4" width="w-1/2" className="mb-2" />
                    <AuthSkeleton height="h-40" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Settings Loading State</h3>
                <AuthSkeleton form />
                <div className="pt-4">
                  <AuthSkeleton height="h-10" width="w-1/4" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
