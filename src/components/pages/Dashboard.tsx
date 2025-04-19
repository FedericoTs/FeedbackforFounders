import React from "react";
import { useAuth } from "../../../supabase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Code,
  FileText,
  Flag,
  MessageSquare,
  Plus,
  Star,
  Trophy,
  Users,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome back! Here's an overview of your projects and feedback.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Projects
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  12
                </h3>
              </div>
              <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Feedback Received
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  48
                </h3>
              </div>
              <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Points Earned
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  750
                </h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Achievements
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  8
                </h3>
              </div>
              <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects and Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Projects */}
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Projects
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-teal-600 dark:text-teal-400"
                >
                  View all
                </Button>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Your most recent projects and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Project Item */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <Code className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Website Redesign
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last updated 2 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/70">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Progress
                      </span>
                      <span className="font-medium text-teal-600 dark:text-teal-400">
                        75%
                      </span>
                    </div>
                    <Progress
                      value={75}
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex -space-x-2">
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                        <AvatarFallback>U1</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2" />
                        <AvatarFallback>U2</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3" />
                        <AvatarFallback>U3</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MessageSquare className="h-4 w-4" />
                      <span>12 feedbacks</span>
                    </div>
                  </div>
                </div>

                {/* Project Item */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          Mobile App UX
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last updated 5 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/70">
                      In Review
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Progress
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        90%
                      </span>
                    </div>
                    <Progress
                      value={90}
                      className="h-2 bg-slate-200 dark:bg-slate-700"
                      indicatorClassName="bg-amber-500 dark:bg-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex -space-x-2">
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user4" />
                        <AvatarFallback>U4</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user5" />
                        <AvatarFallback>U5</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MessageSquare className="h-4 w-4" />
                      <span>8 feedbacks</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Board */}
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Task Board
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Manage your tasks and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="todo" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger
                    value="todo"
                    className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 dark:data-[state=active]:bg-teal-900/20 dark:data-[state=active]:text-teal-400"
                  >
                    To Do (3)
                  </TabsTrigger>
                  <TabsTrigger
                    value="inprogress"
                    className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 dark:data-[state=active]:bg-cyan-900/20 dark:data-[state=active]:text-cyan-400"
                  >
                    In Progress (2)
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/20 dark:data-[state=active]:text-emerald-400"
                  >
                    Completed (4)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="todo" className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Flag className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          Review feedback for Website Redesign
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due in 2 days
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                      High
                    </Badge>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Flag className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          Prepare presentation for client meeting
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due in 3 days
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      Medium
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="inprogress" className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          Implement feedback changes for Mobile App
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Started 1 day ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400">
                      In Progress
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="completed" className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                          Create initial wireframes for Website Redesign
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Completed 3 days ago
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      Completed
                    </Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed and Stats */}
        <div className="space-y-8">
          {/* User Stats */}
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Your Stats
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Your performance and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-50" />
                  <Avatar className="h-16 w-16 ring-2 ring-white dark:ring-slate-800">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.email || ""}
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                    {user.email}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
                      <BarChart3 className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span>Level 5 Feedback Provider</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Level Progress
                    </span>
                    <span className="font-medium text-teal-600 dark:text-teal-400">
                      68%
                    </span>
                  </div>
                  <Progress
                    value={68}
                    className="h-2 bg-slate-200 dark:bg-slate-700"
                    indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>750 / 1100 points</span>
                    <span>Next level: 6</span>
                  </div>
                </div>

                <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                    Recent Achievements
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-1">
                        <Trophy className="h-5 w-5 text-teal-500 dark:text-teal-400" />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 text-center">
                        First Feedback
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-1">
                        <Star className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 text-center">
                        Top Reviewer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Activity Feed
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Recent activity on your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-medium">John Doe</span> left a
                      feedback on{" "}
                      <span className="font-medium">Website Redesign</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      2 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-medium">Mobile App UX</span> project
                      status changed to{" "}
                      <span className="font-medium">In Review</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      1 day ago
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      You earned the{" "}
                      <span className="font-medium">Top Reviewer</span> badge
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      3 days ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
