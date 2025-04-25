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
import { useState, useEffect } from "react";
import StoryboardAuthWrapper from "@/components/auth/StoryboardAuthWrapper";

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

function LandingPage() {
  // Sample testimonials data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "UX Designer",
      company: "DesignCraft",
      content:
        "The feedback I've received through this platform has transformed my design process. The quality and specificity of comments helped me iterate faster.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      type: "creator",
    },
    {
      id: 2,
      name: "Sarah Williams",
      role: "Product Manager",
      company: "TechInnovate",
      content:
        "As someone who regularly needs user feedback, this platform has been a game-changer. The reward system ensures high-quality, thoughtful responses.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      type: "creator",
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Feedback Provider",
      company: "",
      content:
        "I love being able to contribute meaningful feedback and earn rewards. It feels great knowing my insights are valued and actually implemented.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      type: "feedback",
    },
  ];

  // Sample features data
  const features: Feature[] = [
    {
      title: "Reward-Based Feedback",
      description:
        "Earn points, badges, and rewards for providing high-quality, actionable feedback to creators.",
      icon: <Award className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Quality Analysis",
      description:
        "Our AI analyzes feedback quality to ensure creators receive specific, actionable, and constructive input.",
      icon: <BarChart className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Creator Dashboard",
      description:
        "Track feedback trends, manage projects, and connect with top feedback providers all in one place.",
      icon: <Gauge className="h-10 w-10 text-teal-500" />,
    },
    {
      title: "Feedback Marketplace",
      description:
        "Browse projects seeking feedback or list your own creation to receive targeted insights.",
      icon: <Compass className="h-10 w-10 text-teal-500" />,
    },
  ];

  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-teal-500" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                FeedbackLoop
              </span>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <a
                href="#features"
                className="text-slate-600 hover:text-teal-500 transition-colors"
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-slate-600 hover:text-teal-500 transition-colors"
              >
                Testimonials
              </a>

              <Link
                to="/login"
                className="text-teal-500 hover:text-teal-600 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                  Sign up
                </Button>
              </Link>
            </nav>
            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors">
                Now in Public Beta
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                Get{" "}
                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  rewarded
                </span>{" "}
                for your feedback
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                Join our ecosystem where quality feedback is valued and
                rewarded. Help creators improve while earning points, badges,
                and perks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/discovery">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-teal-500 text-teal-500 hover:bg-teal-50"
                  >
                    Browse Projects
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-4 text-slate-600">
                <div className="flex -space-x-2">
                  <Avatar className="border-2 border-white">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" />
                    <AvatarFallback>ES</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Robert" />
                    <AvatarFallback>RT</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-sm">
                  Join <strong>2,500+</strong> members already in our community
                </span>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica" />
                        <AvatarFallback>JM</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">
                          Jessica Miller
                        </p>
                        <p className="text-xs text-slate-500">
                          Product Designer
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Level 7
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Feedback Quality Score
                      </span>
                      <span className="font-medium text-teal-600">87/100</span>
                    </div>
                    <Progress value={87} className="h-2 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-teal-500">42</p>
                      <p className="text-xs text-slate-600">Feedback Given</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-teal-500">1.2k</p>
                      <p className="text-xs text-slate-600">Points Earned</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-teal-500">8</p>
                      <p className="text-xs text-slate-600">Badges</p>
                    </div>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-teal-100 rounded-full p-2">
                        <Trophy className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-teal-800">
                          New Achievement Unlocked!
                        </p>
                        <p className="text-sm text-teal-600">
                          "Feedback Expert" - Provided 10 high-quality feedback
                          responses
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                      Next reward in <strong>{100 - progress} points</strong>
                    </p>
                    <Progress
                      value={progress}
                      className="w-32 h-2 bg-slate-100"
                    />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-teal-100/50 to-cyan-100/50 rounded-full blur-3xl opacity-70" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              A complete feedback ecosystem
            </h2>
            <p className="text-lg text-slate-600">
              Our platform connects creators with feedback providers through an
              incentivized, reward-based approach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-slate-100 hover:border-teal-100 hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="p-6">
                  <div className="mb-4 bg-teal-50 rounded-lg w-16 h-16 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors">
                  How It Works
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Gamified feedback that benefits everyone
                </h3>
                <p className="text-slate-600">
                  Our unique approach turns feedback into a rewarding experience
                  for both creators and feedback providers.
                </p>
                <ul className="space-y-3">
                  {[
                    "Creators get high-quality, actionable feedback",
                    "Feedback providers earn points, badges, and rewards",
                    "AI-powered quality analysis ensures valuable insights",
                    "Built-in gamification keeps engagement high",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link to="/signup">
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                      Join the Ecosystem
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <Tabs defaultValue="creator" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="creator">For Creators</TabsTrigger>
                      <TabsTrigger value="provider">
                        For Feedback Providers
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="creator" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-teal-100 rounded-full p-2">
                            <Upload className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium">Submit your project</p>
                            <p className="text-sm text-slate-600">
                              Upload your design, app, or content for feedback
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <div className="bg-teal-100 rounded-full p-2">
                            <Users className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Receive quality feedback
                            </p>
                            <p className="text-sm text-slate-600">
                              Get insights from our community of feedback
                              experts
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <div className="bg-teal-100 rounded-full p-2">
                            <BarChart3 className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium">Analyze and implement</p>
                            <p className="text-sm text-slate-600">
                              Use our tools to analyze feedback and track
                              improvements
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="provider" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-cyan-100 rounded-full p-2">
                            <Eye className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium">Browse projects</p>
                            <p className="text-sm text-slate-600">
                              Find projects that match your expertise and
                              interests
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <div className="bg-cyan-100 rounded-full p-2">
                            <MessageSquare className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Provide valuable feedback
                            </p>
                            <p className="text-sm text-slate-600">
                              Share your insights and suggestions to help
                              creators
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <div className="bg-cyan-100 rounded-full p-2">
                            <Trophy className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium">Earn rewards</p>
                            <p className="text-sm text-slate-600">
                              Get points, badges, and perks for quality feedback
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What our users are saying
            </h2>
            <p className="text-lg text-slate-600">
              Hear from creators and feedback providers who are part of our
              growing ecosystem.
            </p>
          </div>

          <TestimonialCarousel testimonials={testimonials} />

          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">
              4.9 out of 5 stars from over 600 reviews
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {[
                { icon: <Github className="h-6 w-6" />, name: "GitHub" },
                { icon: <Twitter className="h-6 w-6" />, name: "Twitter" },
                { icon: <Instagram className="h-6 w-6" />, name: "Instagram" },
              ].map((social, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 text-slate-600 hover:text-teal-500 transition-colors cursor-pointer"
                >
                  {social.icon}
                  <span>{social.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to transform how you give and receive feedback?
            </h2>
            <p className="text-xl text-teal-50 mb-8">
              Join our community today and start earning rewards for your
              valuable insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button className="w-full sm:w-auto bg-white text-teal-600 hover:bg-teal-50">
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/discovery">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10"
                >
                  Browse Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-teal-400" />
                <span className="ml-2 text-lg font-bold text-white">
                  FeedbackLoop
                </span>
              </div>
              <p className="text-sm text-slate-400">
                A gamified feedback ecosystem connecting creators with feedback
                providers through rewards and incentives.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                {["Features", "Pricing", "Testimonials", "FAQ", "Roadmap"].map(
                  (item, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                {["Documentation", "Blog", "Community", "Support", "API"].map(
                  (item, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                {[
                  "About Us",
                  "Careers",
                  "Privacy Policy",
                  "Terms of Service",
                  "Contact",
                ].map((item, i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} FeedbackLoop. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Privacy", "Terms", "Cookies"].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-sm text-slate-500 hover:text-teal-400 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <LandingPage />;
}
