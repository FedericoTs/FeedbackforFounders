"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  Sparkles,
  CreditCard,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";

// Define the Plan type
interface Plan {
  id: string;
  object: string;
  active: boolean;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  product: string;
  created: number;
  livemode: boolean;
  [key: string]: any;
}

export default function PricingSection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Use the Supabase client to call the Edge Function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-get-plans",
      );

      if (error) {
        throw error;
      }

      setPlans(data || []);
      setError("");
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setError("Failed to load plans. Please try again later.");
    }
  };

  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
        variant: "default",
      });
      window.location.href = "/login?redirect=pricing";
      return;
    }

    setIsLoading(true);
    setProcessingPlanId(priceId);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
          },
        },
      );

      if (error) {
        throw error;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        toast({
          title: "Redirecting to checkout",
          description:
            "You'll be redirected to Stripe to complete your purchase.",
          variant: "default",
        });
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to create checkout session. Please try again.");
      toast({
        title: "Checkout failed",
        description:
          "There was an error creating your checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingPlanId(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100);
  };

  // Plan features
  const getPlanFeatures = (planType: string) => {
    const basicFeatures = [
      "Core application features",
      "Basic authentication",
      "1GB storage",
      "Community support",
    ];

    const proFeatures = [
      ...basicFeatures,
      "Advanced analytics",
      "Priority support",
      "10GB storage",
      "Custom branding",
    ];

    const enterpriseFeatures = [
      ...proFeatures,
      "Dedicated account manager",
      "Custom integrations",
      "Unlimited storage",
      "SLA guarantees",
    ];

    if (planType.includes("PRO")) return proFeatures;
    if (planType.includes("ENTERPRISE")) return enterpriseFeatures;
    return basicFeatures;
  };

  // Get plan color based on type
  const getPlanColor = (planType: string) => {
    if (planType.includes("ENTERPRISE")) return "emerald";
    if (planType.includes("PRO")) return "cyan";
    return "teal";
  };

  // Get plan icon based on type
  const getPlanIcon = (planType: string) => {
    if (planType.includes("ENTERPRISE")) return <Shield className="h-5 w-5" />;
    if (planType.includes("PRO")) return <CreditCard className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="container px-4 mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 inline" />
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-600 text-lg">
            Choose the perfect plan for your needs. All plans include access to
            our core features. No hidden fees or surprises.
          </p>
        </div>

        {error && (
          <div
            className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl relative mb-6 shadow-sm"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3 text-rose-600 hover:text-rose-800"
              onClick={() => setError("")}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const planColor = getPlanColor(plan.product);
            const planIcon = getPlanIcon(plan.product);

            return (
              <Card
                key={plan.id}
                className="group flex flex-col h-full bg-white/90 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${planColor}-400 via-${planColor}-500 to-${planColor}-400`}
                />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-sm text-slate-600 flex items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full bg-${planColor}-100 mr-2`}
                      >
                        {planIcon}
                      </div>
                      {plan.interval_count === 1
                        ? "Monthly"
                        : `Every ${plan.interval_count} ${plan.interval}s`}
                    </CardDescription>
                    <Badge
                      className={`bg-${planColor}-100 text-${planColor}-700 hover:bg-${planColor}-200 border-none`}
                    >
                      {plan.product.includes("PRO")
                        ? "Pro"
                        : plan.product.includes("ENTERPRISE")
                          ? "Enterprise"
                          : "Basic"}
                    </Badge>
                  </div>
                  <div className="mt-6">
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500">
                      {formatCurrency(plan.amount, plan.currency)}
                    </span>
                    <span className="text-slate-600">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Separator className="my-4 bg-slate-100" />
                  <ul className="space-y-3">
                    {getPlanFeatures(plan.product).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-slate-700"
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full bg-${planColor}-100 mr-2 flex-shrink-0 mt-0.5`}
                        >
                          <CheckCircle2
                            className={`h-3 w-3 text-${planColor}-600`}
                          />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full bg-gradient-to-r from-${planColor}-500 to-${planColor}-600 hover:from-${planColor}-600 hover:to-${planColor}-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-full group-hover:scale-[1.02] transform-gpu`}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading && processingPlanId === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
