"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  User,
  Zap,
  Shield,
  Code,
  CheckCircle2,
  ArrowRight,
  Star,
  Github,
  Twitter,
  Instagram,
  Trophy,
  Medal,
  Gift,
  ThumbsUp,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Rocket,
  Smartphone,
  Palette,
  Upload,
  MessageSquare,
  Eye,
  Users,
  TrendingUp,
  Award,
  MousePointer,
  Repeat,
  Flame,
  Heart,
  Laptop,
  PenTool,
  BarChart,
  Gauge,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/supabase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import PricingSection from "../home/PricingSection";
import TestimonialCarousel from "../home/TestimonialCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

// Testimonial interface
interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  type: "creator" | "feedback";
}

// Feature interface
interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const [activeStep, setActiveStep] = useState(1);

  // Sample features data - updated for feedback ecosystem
  const features: Feature[] = [
    {
      title: "Earn Points & Rewards",
      description:
        "Provide valuable feedback and earn points that can be redeemed for exclusive rewards and benefits.",
      icon: <Trophy className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Unlock Achievements",
      description:
        "Complete feedback milestones to unlock badges and achievements that showcase your expertise.",
      icon: <Medal className="h-10 w-10 text-amber-400" />,
    },
    {
      title: "Creator Connections",
      description:
        "Connect directly with creators and build relationships that lead to ongoing collaboration opportunities.",
      icon: <ThumbsUp className="h-10 w-10 text-cyan-500" />,
    },
    {
      title: "Exclusive Rewards",
      description:
        "Top feedback providers gain access to premium content, early releases, and special creator offers.",
      icon: <Gift className="h-10 w-10 text-rose-400" />,
    },
  ];

  // Sample testimonials data - updated for feedback ecosystem
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Content Creator",
      company: "CreativeFlow",
      content:
        "The feedback I've received through this platform has transformed my content. The gamification makes people excited to provide detailed, thoughtful feedback.",
      avatar: "sarah",
      type: "creator",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Feedback Provider",
      company: "Tech Enthusiast",
      content:
        "I love earning points and badges while helping creators improve. It's addictive to see my feedback directly influence the final product.",
      avatar: "michael",
      type: "feedback",
    },
    {
      id: 3,
      name: "Aisha Patel",
      role: "Game Developer",
      company: "PixelWave",
      content:
        "The quality of feedback is outstanding. The platform attracts people who genuinely care about helping creators succeed, not just earning rewards.",
      avatar: "aisha",
      type: "creator",
    },
  ];

  // User journey steps
  const creatorSteps = [
    {
      title: "Sign Up",
      description: "Create your profile and get started with initial points",
      icon: <User className="h-6 w-6 text-teal-500" />,
    },
    {
      title: "Upload Projects",
      description: "Share your website links or startup concepts for review",
      icon: <Upload className="h-6 w-6 text-teal-500" />,
    },
    {
      title: "Receive Feedback",
      description: "Get detailed insights from our community of reviewers",
      icon: <MessageSquare className="h-6 w-6 text-teal-500" />,
    },
    {
      title: "Implement Changes",
      description: "Use the feedback to improve your projects",
      icon: <PenTool className="h-6 w-6 text-teal-500" />,
    },
    {
      title: "Track Progress",
      description: "Monitor improvements and growth over time",
      icon: <TrendingUp className="h-6 w-6 text-teal-500" />,
    },
  ];

  const feedbackSteps = [
    {
      title: "Browse Projects",
      description: "Discover interesting websites and startup ideas to review",
      icon: <Compass className="h-6 w-6 text-cyan-500" />,
    },
    {
      title: "Provide Feedback",
      description: "Use our pointing tool to give contextual insights",
      icon: <MousePointer className="h-6 w-6 text-cyan-500" />,
    },
    {
      title: "Earn Points",
      description: "Get rewarded based on the quality of your feedback",
      icon: <Award className="h-6 w-6 text-cyan-500" />,
    },
    {
      title: "Level Up",
      description: "Gain experience and unlock new achievements",
      icon: <TrendingUp className="h-6 w-6 text-cyan-500" />,
    },
    {
      title: "Redeem Rewards",
      description: "Use your points to boost your own projects",
      icon: <Gift className="h-6 w-6 text-cyan-500" />,
    },
  ];

  // Gamification elements
  const gamificationElements = [
    {
      title: "Point System",
      description:
        "Earn points for quality feedback that creators find helpful",
      icon: <BarChart className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Achievement Badges",
      description:
        "Unlock badges for reaching milestones and consistent contributions",
      icon: <Award className="h-10 w-10 text-amber-400" />,
    },
    {
      title: "Leaderboards",
      description: "Compete with others to be recognized as a top contributor",
      icon: <TrendingUp className="h-10 w-10 text-cyan-500" />,
    },
    {
      title: "Level System",
      description:
        "Progress through levels as you provide more valuable feedback",
      icon: <Gauge className="h-10 w-10 text-emerald-500" />,
    },
    {
      title: "Feedback Streaks",
      description:
        "Earn bonus points for consistent daily or weekly participation",
      icon: <Flame className="h-10 w-10 text-orange-500" />,
    },
    {
      title: "Point Redemption",
      description:
        "Spend your points to feature your own projects or access premium features",
      icon: <Repeat className="h-10 w-10 text-rose-400" />,
    },
  ];

  // Stats
  const stats = [
    {
      value: "10,000+",
      label: "Active Users",
      icon: <Users className="h-5 w-5 text-teal-500" />,
    },
    {
      value: "50,000+",
      label: "Projects Reviewed",
      icon: <Eye className="h-5 w-5 text-cyan-500" />,
    },
    {
      value: "250,000+",
      label: "Feedback Provided",
      icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
    },
    {
      value: "95%",
      label: "Satisfaction Rate",
      icon: <Heart className="h-5 w-5 text-rose-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 blur-3xl opacity-70" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-rose-50 via-fuchsia-50 to-violet-50 blur-3xl opacity-70" />
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-gradient-to-r from-amber-50 to-orange-50 blur-3xl opacity-60" />
        <svg
          className="fixed top-0 left-0 w-full h-screen -z-10 opacity-[0.03]"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="grid"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="font-bold text-xl flex items-center text-slate-900"
            >
              <div className="relative mr-2">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-md blur-[6px] opacity-75" />
                <Zap className="h-6 w-6 relative text-white" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500 font-extrabold">
                FeedbackLoop
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 group"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Avatar className="h-8 w-8 ring-2 ring-white">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                            alt={user.email || ""}
                          />
                          <AvatarFallback>
                            {user.email?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="hidden md:inline-block">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white/90 backdrop-blur-lg border-slate-200 rounded-xl shadow-lg"
                  >
                    <DropdownMenuLabel className="text-slate-900">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-200" />
                    <DropdownMenuItem className="text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 rounded-md">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 rounded-md">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-200" />
                    <DropdownMenuItem
                      onSelect={() => signOut()}
                      className="text-slate-700 hover:text-slate-900 focus:text-slate-900 hover:bg-slate-100 focus:bg-slate-100 rounded-md"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="container px-4 mx-auto relative">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 space-y-8 relative z-10">
                <div>
                  <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
                    Gamified Feedback Platform
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 leading-[1.1]">
                    Give Feedback,
                    <br />
                    Earn Rewards
                  </h1>
                </div>
                <p className="text-lg md:text-xl text-slate-600">
                  Join our community where creators get valuable insights and
                  feedback providers earn points, badges, and exclusive rewards.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-full w-full sm:w-auto group"
                    >
                      Join FeedbackLoop
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-full w-full sm:w-auto"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    How It Works
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100">
                      <CheckCircle2 className="h-3 w-3 text-teal-600" />
                    </div>
                    <span>Earn points with every feedback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100">
                      <CheckCircle2 className="h-3 w-3 text-cyan-600" />
                    </div>
                    <span>Unlock achievement badges</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>Redeem rewards</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-teal-200/40 via-cyan-200/30 to-emerald-200/20 rounded-3xl blur-2xl transform scale-110" />
                <div className="relative">
                  {/* Floating elements */}
                  <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br from-amber-300/20 to-amber-400/30 rounded-2xl rotate-12 backdrop-blur-md border border-amber-200/50 shadow-xl animate-float-slow z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-amber-500/80" />
                    </div>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-br from-rose-300/20 to-rose-400/30 rounded-full backdrop-blur-md border border-rose-200/50 shadow-xl animate-float z-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Medal className="h-8 w-8 text-rose-500/80" />
                    </div>
                  </div>

                  {/* Main card */}
                  <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-75" />
                            <Avatar className="h-10 w-10 ring-2 ring-white">
                              <AvatarImage
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
                                alt="User"
                              />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              Alex Morgan
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-100">
                                <BarChart3 className="h-2.5 w-2.5 text-teal-600" />
                              </div>
                              <span>Level 5 Feedback Provider</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                            750 Points
                          </div>
                          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                            12 Badges
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-slate-900">
                              Your Feedback Stats
                            </h4>
                            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200">
                              This Week
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
                              <div className="text-2xl font-bold text-teal-500">
                                8
                              </div>
                              <div className="text-xs text-slate-500">
                                Feedbacks
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
                              <div className="text-2xl font-bold text-cyan-500">
                                4.9
                              </div>
                              <div className="text-xs text-slate-500">
                                Avg. Rating
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
                              <div className="text-2xl font-bold text-emerald-500">
                                +150
                              </div>
                              <div className="text-xs text-slate-500">
                                Points
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                                <Code className="h-4 w-4 text-teal-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                Website Redesign Feedback
                              </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                              +50 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                                <Smartphone className="h-4 w-4 text-cyan-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                Mobile App UX Review
                              </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                              +75 pts
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                                <Palette className="h-4 w-4 text-rose-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                Logo Design Feedback
                              </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                              +25 pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAFBFF] to-slate-50 -z-10" />
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border-slate-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="container px-4 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                A Platform for Both Creators & Reviewers
              </h2>
              <p className="text-slate-600 text-lg">
                Our ecosystem connects those seeking feedback with those who
                provide valuable insights, creating a win-win environment for
                everyone.
              </p>
            </div>

            <Tabs defaultValue="creator" className="w-full max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger
                  value="creator"
                  className="bg-slate-100 text-slate-700 rounded-full py-3 border-none transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  For Creators
                </TabsTrigger>
                <TabsTrigger
                  value="reviewer"
                  className="bg-slate-100 text-slate-700 rounded-full py-3 border-none transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  For Feedback Providers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="creator" className="mt-0">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
                  <div className="flex flex-col space-y-8">
                    {creatorSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activeStep === index + 1
                              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {activeStep === index + 1 ? (
                            step.icon
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <Badge
                              className={`${
                                activeStep === index + 1
                                  ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              } self-start md:self-auto`}
                            >
                              Step {index + 1}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mt-1">
                            {step.description}
                          </p>
                          {index < creatorSteps.length - 1 && (
                            <div className="mt-4 ml-5 h-8 border-l-2 border-dashed border-slate-200" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviewer" className="mt-0">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
                  <div className="flex flex-col space-y-8">
                    {feedbackSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activeStep === index + 1
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {activeStep === index + 1 ? (
                            step.icon
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <Badge
                              className={`${
                                activeStep === index + 1
                                  ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              } self-start md:self-auto`}
                            >
                              Step {index + 1}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mt-1">
                            {step.description}
                          </p>
                          {index < feedbackSteps.length - 1 && (
                            <div className="mt-4 ml-5 h-8 border-l-2 border-dashed border-slate-200" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Gamification Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="container px-4 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                <Trophy className="h-3.5 w-3.5 mr-1.5 inline" />
                Gamification
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                Earn While You Learn
              </h2>
              <p className="text-slate-600 text-lg">
                Our platform transforms the feedback process into an engaging
                experience with points, badges, and rewards that motivate
                meaningful contributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gamificationElements.map((element, index) => (
                <Card
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <CardHeader className="pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                      {element.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {element.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{element.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* User Journey Showcase */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="container px-4 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                <Users className="h-3.5 w-3.5 mr-1.5 inline" />
                User Journey
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                Experience the Complete Workflow
              </h2>
              <p className="text-slate-600 text-lg">
                Follow the journey of both creators and feedback providers as
                they interact on our platform.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Creator Dashboard
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Project Performance
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-600">
                              Website Redesign
                            </span>
                            <span className="text-sm font-medium text-teal-600">
                              85%
                            </span>
                          </div>
                          <Progress
                            value={85}
                            className="h-2 bg-slate-200"
                            indicatorClassName="bg-teal-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-600">
                              Mobile App
                            </span>
                            <span className="text-sm font-medium text-cyan-600">
                              62%
                            </span>
                          </div>
                          <Progress
                            value={62}
                            className="h-2 bg-slate-200"
                            indicatorClassName="bg-cyan-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-600">
                              Logo Design
                            </span>
                            <span className="text-sm font-medium text-emerald-600">
                              91%
                            </span>
                          </div>
                          <Progress
                            value={91}
                            className="h-2 bg-slate-200"
                            indicatorClassName="bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Recent Feedback
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer1"
                                alt="Reviewer"
                              />
                              <AvatarFallback>R</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-900">
                              John D.
                            </span>
                            <div className="flex ml-auto">
                              {[...Array(4)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">
                            "The navigation could be more intuitive. Consider
                            reorganizing the menu items."
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer2"
                                alt="Reviewer"
                              />
                              <AvatarFallback>R</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-900">
                              Emma S.
                            </span>
                            <div className="flex ml-auto">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">
                            "Love the color scheme! The contrast makes
                            everything easy to read."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl overflow-hidden p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Feedback Provider Journey
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Your Achievements
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded-lg p-2 border border-slate-100 flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center mb-1">
                            <Trophy className="h-5 w-5 text-teal-500" />
                          </div>
                          <span className="text-xs text-slate-600 text-center">
                            First Feedback
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100 flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center mb-1">
                            <Medal className="h-5 w-5 text-cyan-500" />
                          </div>
                          <span className="text-xs text-slate-600 text-center">
                            Top Reviewer
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100 flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                            <Flame className="h-5 w-5 text-emerald-500" />
                          </div>
                          <span className="text-xs text-slate-600 text-center">
                            7-Day Streak
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-100 flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center mb-1">
                            <Heart className="h-5 w-5 text-rose-500" />
                          </div>
                          <span className="text-xs text-slate-600 text-center">
                            Helpful Pro
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Projects to Review
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-100 flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center mr-3">
                            <Laptop className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-slate-900">
                              E-commerce Website
                            </h5>
                            <p className="text-xs text-slate-600">
                              Needs UX/UI feedback
                            </p>
                          </div>
                          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200">
                            +75 pts
                          </Badge>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100 flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center mr-3">
                            <Smartphone className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-slate-900">
                              Fitness App
                            </h5>
                            <p className="text-xs text-slate-600">
                              Seeking onboarding feedback
                            </p>
                          </div>
                          <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                            +60 pts
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Your Progress
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-600">
                              Level 5 Progress
                            </span>
                            <span className="text-sm font-medium text-teal-600">
                              68%
                            </span>
                          </div>
                          <Progress
                            value={68}
                            className="h-2 bg-slate-200"
                            indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-500"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>750 / 1100 points</span>
                          <span>Next level: 6</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50 -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="container px-4 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
                Features
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                Gamified Feedback Experience
              </h2>
              <p className="text-slate-600 text-lg">
                Our platform turns the feedback process into an engaging
                experience with points, badges, and rewards for both creators
                and feedback providers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <CardHeader className="pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-0 h-auto"
                    >
                      <span className="text-sm">Learn more</span>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="container px-4 mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                Loved by Creators & Feedback Providers
              </h2>
              <p className="text-slate-600 text-lg">
                See what our community members have to say about their
                experience with FeedbackLoop.
              </p>
            </div>

            {/* Mobile view: Grid layout */}
            <div className="md:hidden grid grid-cols-1 gap-8">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="bg-white/80 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-50" />
                        <Avatar className="h-10 w-10 ring-2 ring-white">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`}
                            alt={testimonial.name}
                          />
                          <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <CardTitle className="text-base text-slate-900">
                          {testimonial.name}
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          {testimonial.role} at {testimonial.company}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="mt-2 ml-14 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none">
                      {testimonial.type === "creator"
                        ? "Creator"
                        : "Feedback Provider"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-slate-600">{testimonial.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop view: Carousel */}
            <div className="hidden md:block">
              <TestimonialCarousel
                testimonials={testimonials}
                autoplayInterval={5000}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container px-4 mx-auto">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur-xl -z-10" />
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-5 mix-blend-overlay -z-10" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-cyan-400/30 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-emerald-400/20 to-teal-400/30 rounded-full blur-3xl -z-10" />

              <div className="p-8 md:p-16">
                <div className="max-w-3xl mx-auto text-center">
                  <Badge className="mb-6 bg-white/90 text-teal-700 hover:bg-white border-none px-4 py-1.5 rounded-full shadow-sm">
                    <Rocket className="h-4 w-4 mr-2 inline" />
                    Join 10,000+ users already on the platform
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                    Ready to Join Our Feedback Community?
                  </h2>
                  <p className="text-lg md:text-xl mb-8 text-slate-700">
                    Whether you're a creator seeking valuable insights or
                    someone who loves providing feedback, there's a place for
                    you in our ecosystem.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/signup">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-full w-full sm:w-auto group"
                      >
                        Join FeedbackLoop
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white rounded-full w-full sm:w-auto"
                    >
                      Learn More
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link
                to="/"
                className="font-bold text-xl flex items-center mb-4 text-slate-900"
              >
                <div className="relative mr-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-md blur-[6px] opacity-75" />
                  <Zap className="h-6 w-6 relative text-white" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500 font-extrabold">
                  FeedbackLoop
                </span>
              </Link>
              <p className="text-slate-600 mb-4">
                A gamified platform connecting creators with feedback providers
                through points, badges, and rewards.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 h-9 w-9"
                >
                  <Github className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-slate-200 text-slate-600 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50 h-9 w-9"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 h-9 w-9"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-slate-900">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    For Creators
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    For Feedback Providers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-slate-900">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-slate-900">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-slate-600 hover:text-teal-600 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-slate-100" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} FeedbackLoop. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="#"
                className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="#"
                className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="#"
                className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
