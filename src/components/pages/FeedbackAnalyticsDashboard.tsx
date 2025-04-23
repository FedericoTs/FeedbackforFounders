import React from "react";
import FeedbackAnalyticsDashboard from "../feedback/FeedbackAnalyticsDashboard";
import { useParams } from "react-router-dom";

const FeedbackAnalyticsDashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="container mx-auto py-6 px-4">
      <FeedbackAnalyticsDashboard projectId={projectId} />
    </div>
  );
};

export default FeedbackAnalyticsDashboardPage;
