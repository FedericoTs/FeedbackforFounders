"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Testimonial interface
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  type: "creator" | "feedback";
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoplayInterval?: number;
}

export default function TestimonialCarousel({
  testimonials,
  autoplayInterval = 5000,
}: TestimonialCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextTestimonial = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setDirection(-1);
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  }, [testimonials.length]);

  // Autoplay functionality
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [
    activeIndex,
    autoplayInterval,
    isPaused,
    nextTestimonial,
    testimonials.length,
  ]);

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (!testimonials.length) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div
        className="overflow-hidden py-8 px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <Card className="bg-white/90 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg overflow-hidden mx-auto max-w-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-50" />
                    <Avatar className="h-10 w-10 ring-2 ring-white">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonials[activeIndex].avatar}`}
                        alt={testimonials[activeIndex].name}
                      />
                      <AvatarFallback>
                        {testimonials[activeIndex].name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      {testimonials[activeIndex].name}
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {testimonials[activeIndex].role} at{" "}
                      {testimonials[activeIndex].company}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="mt-2 ml-14 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none">
                  <Sparkles className="h-3 w-3 mr-1.5 inline" />
                  {testimonials[activeIndex].type === "creator"
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
                <p className="text-slate-600">
                  {testimonials[activeIndex].content}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex
                ? "bg-gradient-to-r from-teal-400 to-cyan-500 w-6"
                : "bg-slate-200 w-2 hover:bg-slate-300"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:text-teal-600 hover:border-teal-200 hover:bg-white shadow-md pointer-events-auto h-10 w-10"
          onClick={prevTestimonial}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:text-teal-600 hover:border-teal-200 hover:bg-white shadow-md pointer-events-auto h-10 w-10"
          onClick={nextTestimonial}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
