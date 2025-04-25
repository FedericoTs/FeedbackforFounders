import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AuthLoading, ButtonLoading } from "@/components/ui/auth-loading";

export default function LoadingIndicatorsDemoStoryboard() {
  const [activeSize, setActiveSize] = React.useState<"xs" | "sm" | "md" | "lg">(
    "md",
  );
  const [activeVariant, setActiveVariant] = React.useState<
    "default" | "primary" | "secondary" | "ghost"
  >("default");
  const [activeType, setActiveType] = React.useState<
    "spinner" | "dots" | "pulse"
  >("spinner");
  const [showFullPage, setShowFullPage] = React.useState(false);
  const [showText, setShowText] = React.useState(true);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Loading Indicators Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This storyboard demonstrates the standardized loading indicators for
            authentication flows.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Indicator Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Size</h3>
                <div className="grid grid-cols-4 gap-2">
                  {["xs", "sm", "md", "lg"].map((size) => (
                    <Button
                      key={size}
                      variant={activeSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setActiveSize(size as "xs" | "sm" | "md" | "lg")
                      }
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Variant</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["default", "primary", "secondary", "ghost"].map(
                    (variant) => (
                      <Button
                        key={variant}
                        variant={
                          activeVariant === variant ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setActiveVariant(
                            variant as
                              | "default"
                              | "primary"
                              | "secondary"
                              | "ghost",
                          )
                        }
                      >
                        {variant}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {["spinner", "dots", "pulse"].map((type) => (
                    <Button
                      key={type}
                      variant={activeType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setActiveType(type as "spinner" | "dots" | "pulse")
                      }
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showText"
                    checked={showText}
                    onChange={(e) => setShowText(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showText" className="text-sm">
                    Show Text
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showFullPage"
                    checked={showFullPage}
                    onChange={(e) => setShowFullPage(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showFullPage" className="text-sm">
                    Full Page Overlay
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loading Indicator Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 border rounded-md">
              <AuthLoading
                size={activeSize}
                variant={activeVariant}
                type={activeType}
                text={showText ? "Loading authentication..." : undefined}
                centered={true}
              />
            </div>

            {showFullPage && (
              <AuthLoading
                size={activeSize}
                variant={activeVariant}
                type={activeType}
                text={showText ? "Loading your profile..." : undefined}
                fullPage={true}
                transparent={false}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Button Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button disabled className="flex items-center space-x-2">
              <ButtonLoading text="Signing in..." />
            </Button>

            <Button disabled className="flex items-center space-x-2">
              <ButtonLoading text="Processing..." />
            </Button>

            <Button disabled className="flex items-center space-x-2">
              <ButtonLoading text="Updating..." />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="button">Button</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Sign In Form Loading</h3>
                <div className="flex items-center justify-center p-6 border rounded-md bg-slate-50">
                  <AuthLoading
                    size="md"
                    variant="primary"
                    text="Signing in..."
                    centered={true}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Loading</h3>
                <div className="flex items-center justify-center p-6 border rounded-md bg-slate-50">
                  <AuthLoading
                    size="lg"
                    variant="secondary"
                    type="dots"
                    text="Loading your profile..."
                    centered={true}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="button" className="border rounded-md p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Button Loading States</h3>
                <div className="flex flex-col space-y-4 items-center justify-center p-6 border rounded-md bg-slate-50">
                  <Button disabled className="w-full">
                    <AuthLoading
                      size="xs"
                      text="Signing in..."
                      variant="ghost"
                    />
                  </Button>
                  <Button disabled className="w-full">
                    <AuthLoading
                      size="xs"
                      text="Updating profile..."
                      variant="ghost"
                    />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
