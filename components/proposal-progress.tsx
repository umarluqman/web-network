import React from "react";

import { formatNumberToString } from "helpers/formatNumber";

import { DistribuitonPerUser } from "interfaces/proposal";


import Avatar from "./avatar";

interface IProposalProgressProps {
  usersDistribution: DistribuitonPerUser[];
}

export default function ProposalProgress({
  usersDistribution
}: IProposalProgressProps) {
  return (
    <div className="container bg-shadow p-2">
      <div className="d-flex justify-content-center align-items-center gap-2">
        {usersDistribution.length &&
          React.Children.toArray(usersDistribution.map((item, index) => (
              <div
                key={index}
                className={
                  "rounded-bottom d-flex flex-column align-items-center gap-2"
                }
                style={{ width: `${item.percentage}%` }}
              >
                <Avatar key={index} userLogin={item.githubLogin} tooltip />

                <p className="caption-small">
                  {formatNumberToString(item.percentage, 0)}%
                </p>

                <span className="w-100 bg-primary p-1 rounded" />
              </div>
            )))}
      </div>
    </div>
  );
}
