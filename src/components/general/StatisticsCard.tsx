
import { Card } from "../ui/card"

import {type  ReactNode } from "react";

interface StatisticsCardProps {
  cardStyles : string,
  title: string;
  value: string;
  footerIcon: ReactNode | null;
  footer: string;
  children?: ReactNode;
  icon : ReactNode | null,
  iconStyles : string 

}

const StatisticsCard = ({ cardStyles , title , value, footerIcon, footer , icon ,iconStyles  }: StatisticsCardProps) => {
  return (
    <Card className={` ${cardStyles} px-4 hover:shadow-xl`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-3xl font-bold text-foreground mt-1">{value}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="flex items-center">
              {footerIcon ?? footerIcon}
              <span className="ml-1">{footer}</span>
            </span>
          </p>
        </div>
        <div className={`p-2 ${iconStyles ?? ""} rounded-full flex items-center justify-center`}>
          {icon ?? icon}
        </div>
      </div>
    </Card>
  );
};

export default StatisticsCard
