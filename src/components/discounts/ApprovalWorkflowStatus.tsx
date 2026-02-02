'use client';

interface ApprovalWorkflowStatusProps {
  status: string;
  currentLevel: number;
  requiredLevel: number;
  bmApprovedAt?: string | null;
  gmApprovedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

export function ApprovalWorkflowStatus({
  status,
  currentLevel,
  requiredLevel,
  bmApprovedAt,
  gmApprovedAt,
  rejectedAt,
  rejectionReason,
}: ApprovalWorkflowStatusProps) {
  const steps = [
    {
      key: 'bm',
      label: 'Branch Manager',
      completed: currentLevel >= 1,
      current: status === 'PENDING_BM',
      approvedAt: bmApprovedAt,
    },
  ];

  if (requiredLevel >= 2) {
    steps.push({
      key: 'gm',
      label: 'General Manager',
      completed: currentLevel >= 2,
      current: status === 'PENDING_GM',
      approvedAt: gmApprovedAt,
    });
  }

  const isRejected = status === 'REJECTED';
  const isApproved = status === 'APPROVED';

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Approval Workflow</h4>

      {/* Progress Steps */}
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            {/* Step Circle */}
            <div className="relative">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${
                    isRejected
                      ? 'bg-red-50 border-red-500'
                      : step.completed
                      ? 'bg-green-500 border-green-500'
                      : step.current
                      ? 'bg-white border-violet-500'
                      : 'bg-white border-gray-300'
                  }
                `}
              >
                {isRejected && step.current ? (
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : step.completed ? (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.current ? (
                  <div className="h-3 w-3 bg-violet-500 rounded-full animate-pulse" />
                ) : (
                  <div className="h-3 w-3 bg-gray-300 rounded-full" />
                )}
              </div>
              {/* Step Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs text-gray-600">{step.label}</span>
              </div>
              {/* Approval Date */}
              {step.approvedAt && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-green-600">
                    {new Date(step.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-1 w-16 mx-2
                  ${step.completed ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}

        {/* Final Status */}
        <div className="flex items-center ml-2">
          <div
            className={`
              h-1 w-8
              ${isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-gray-200'}
            `}
          />
          <div
            className={`
              h-10 w-10 rounded-full flex items-center justify-center border-2
              ${
                isApproved
                  ? 'bg-green-500 border-green-500'
                  : isRejected
                  ? 'bg-red-500 border-red-500'
                  : 'bg-white border-gray-300'
              }
            `}
          >
            {isApproved ? (
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isRejected ? (
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-2">
            <span
              className={`
                text-sm font-medium
                ${isApproved ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-gray-400'}
              `}
            >
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {isRejected && rejectionReason && (
        <div className="mt-8 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-800">Rejection Reason</p>
          <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
          {rejectedAt && (
            <p className="text-xs text-red-500 mt-2">
              Rejected on {new Date(rejectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
