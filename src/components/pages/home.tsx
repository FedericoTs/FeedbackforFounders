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
  Database,
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
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
import FeatureCard from "../home/FeatureCard";
import TestimonialCarousel from "../home/TestimonialCarousel";

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

  // Sample features data - updated for feedback ecosystem
  const features: Feature[] = [
    {
      title: "Earn Points & Rewards",
      description:
        "Provide valuable feedback and earn points that can be redeemed for exclusive rewards and benefits.",
      icon: <Trophy className="h-10 w-10 text-purple-600" />,
    },
    {
      title: "Unlock Achievements",
      description:
        "Complete feedback milestones to unlock badges and achievements that showcase your expertise.",
      icon: <Medal className="h-10 w-10 text-yellow-500" />,
    },
    {
      title: "Creator Connections",
      description:
        "Connect directly with creators and build relationships that lead to ongoing collaboration opportunities.",
      icon: <ThumbsUp className="h-10 w-10 text-blue-500" />,
    },
    {
      title: "Exclusive Rewards",
      description:
        "Top feedback providers gain access to premium content, early releases, and special creator offers.",
      icon: <Gift className="h-10 w-10 text-pink-500" />,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="font-bold text-xl flex items-center text-black"
            >
              <Zap className="h-6 w-6 mr-2 text-purple-600" />
              FeedbackLoop
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-black"
                  >
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 text-gray-700 hover:text-black"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.email || ""}
                        />
                        <AvatarFallback>
                          {user.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white border-gray-200"
                  >
                    <DropdownMenuLabel className="text-black">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem className="text-gray-700 hover:text-black focus:text-black">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-700 hover:text-black focus:text-black">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem
                      onSelect={() => signOut()}
                      className="text-gray-700 hover:text-black focus:text-black"
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
                    className="text-gray-700 hover:text-black"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-purple-600 text-white hover:bg-purple-700">
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
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 space-y-8">
                <div>
                  <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                    Gamified Feedback Platform
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                    Give Feedback, Earn Rewards
                  </h1>
                </div>
                <p className="text-lg md:text-xl text-gray-600">
                  Join our community where creators get valuable insights and
                  feedback providers earn points, badges, and exclusive rewards.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup">
                    <Button
                      size="lg"
                      className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto"
                    >
                      Join FeedbackLoop
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50 w-full sm:w-auto"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    How It Works
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Earn points with every feedback</span>
                  <Separator
                    orientation="vertical"
                    className="h-4 mx-2 bg-gray-300"
                  />
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Unlock achievement badges</span>
                  <Separator
                    orientation="vertical"
                    className="h-4 mx-2 bg-gray-300"
                  />
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Redeem rewards</span>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-purple-200/60 via-blue-300/40 to-pink-300/30 rounded-3xl blur-2xl transform scale-110" />
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-1 bg-gradient-to-r from-purple-400 via-blue-500 to-pink-400 rounded-t-xl">
                    <div className="flex items-center gap-2 px-3 py-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <div className="ml-2 text-xs text-white font-medium">
                        FeedbackLoop Dashboard
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <div>
                        <h3 className="font-medium text-purple-800">
                          Your Feedback Stats
                        </h3>
                        <p className="text-sm text-purple-600">
                          Level 5 Feedback Provider
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                          750 Points
                        </div>
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          12 Badges
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">
                          Website Redesign Feedback
                        </span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          +50 pts
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">
                          Mobile App UX Review
                        </span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          +75 pts
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">
                          Logo Design Feedback
                        </span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          +25 pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-purple-200/60 blur-[100px]" />
          <div className="absolute bottom-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-blue-200/40 blur-[100px]" />
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Gamified Feedback Experience
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                Our platform turns the feedback process into an engaging
                experience with points, badges, and rewards for both creators
                and feedback providers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-black">
                Loved by Creators & Feedback Providers
              </h2>
              <p className="text-gray-600 max-w-[700px] mx-auto">
                See what our community members have to say about their
                experience with FeedbackLoop.
              </p>
            </div>

            {/* Mobile view: Grid layout */}
            <div className="md:hidden grid grid-cols-1 gap-8">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.avatar}`}
                          alt={testimonial.name}
                        />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base text-black">
                          {testimonial.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {testimonial.role} at {testimonial.company}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="mt-2 ml-12" variant="outline">
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
                          className="h-4 w-4 fill-yellow-500 text-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{testimonial.content}</p>
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
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto">
            <div className="bg-gradient-to-r from-purple-100 to-blue-50 rounded-3xl p-8 md:p-12 shadow-xl border border-purple-200">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-800">
                  Ready to Join Our Feedback Community?
                </h2>
                <p className="text-lg md:text-xl mb-8 text-gray-600">
                  Whether you're a creator seeking valuable insights or someone
                  who loves providing feedback, there's a place for you in our
                  ecosystem.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/signup">
                    <Button
                      size="lg"
                      className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto"
                    >
                      Join FeedbackLoop
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50 w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link
                to="/"
                className="font-bold text-xl flex items-center mb-4 text-black"
              >
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                FeedbackLoop
              </Link>
              <p className="text-gray-600 mb-4">
                A gamified platform connecting creators with feedback providers
                through points, badges, and rewards.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-purple-600"
                >
                  <Github className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-purple-600"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-600 hover:text-purple-600"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    For Creators
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    For Feedback Providers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4 text-black">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-gray-600 hover:text-purple-600">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-200" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} FeedbackLoop. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                to="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                Privacy
              </Link>
              <Link
                to="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                Terms
              </Link>
              <Link
                to="#"
                className="text-sm text-gray-600 hover:text-purple-600"
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
