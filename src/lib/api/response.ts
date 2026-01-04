import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

export function notFoundResponse(message = 'Resource not found'): NextResponse<ApiErrorResponse> {
  return errorResponse('NOT_FOUND', message, 404);
}

export function badRequestResponse(message: string, details?: Record<string, unknown>): NextResponse<ApiErrorResponse> {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

export function serverErrorResponse(message = 'Internal server error'): NextResponse<ApiErrorResponse> {
  return errorResponse('INTERNAL_ERROR', message, 500);
}
