import React from "react";
import { Award } from "lucide-react";
import BaseWidget from "./BaseWidget";
import AchievementsPanel from "../AchievementsPanel";

interface AchievementsWidgetProps {
  id: string;
  title?: string;
  className?: string;
  onRemove?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({
  id,
  title = "Achievements",
  className,
  onRemove,
  onEdit,
}) => {
  return (
    <BaseWidget
      id={id}
      title={title}
      icon={<Award className="h-4 w-4 text-amber-500" />}
      className={className}
      onRemove={onRemove}
      onEdit={onEdit}
    >
      <div className="p-1">
        <AchievementsPanel compact={true} showViewAllLink={false} />
      </div>
    </BaseWidget>
  );
};

export default AchievementsWidget;
