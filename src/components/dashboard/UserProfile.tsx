import React from "react";
import { useAuth } from "@/supabase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function UserProfile() {
  const { user } = useAuth();

  // Extract user information
  const fullName = user?.user_metadata?.full_name || "User";
  const email = user?.email || "user@example.com";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const role = user?.user_metadata?.role || "User";

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-teal-100 text-teal-700">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <h3 className="font-semibold text-lg">{fullName}</h3>
          <p className="text-sm text-slate-500 mb-2">{email}</p>

          <Badge
            variant="outline"
            className="mb-4 bg-teal-50 text-teal-700 hover:bg-teal-50"
          >
            {role}
          </Badge>

          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/dashboard/profile">
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Link>
            </Button>

            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/dashboard/settings">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
