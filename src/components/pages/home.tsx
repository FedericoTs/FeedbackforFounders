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

export default function WrappedLandingPage() {
  return (
    <StoryboardAuthWrapper>
      <LandingPage />
    </StoryboardAuthWrapper>
  );
}
