import api from '../api/axios'

import type {
  AuditLog,
  AuditLogQuery,
  AuditLogResponse,
} from '../types/audit-log'

export async function getAuditLogs(
  query: AuditLogQuery = {},
): Promise<AuditLogResponse> {
  const response =
    await api.get(
      '/audit-logs',
      {
        params: {
          page:
            query.page ??
            1,

          limit:
            query.limit ??
            20,

          action:
            query.action ===
            'ALL'
              ? undefined
              : query.action,

          search:
            query.search
              ?.trim() ||
            undefined,
        },
      },
    )

  return response.data
}

export async function getAuditLogById(
  id: number,
): Promise<AuditLog> {
  const response =
    await api.get(
      `/audit-logs/${id}`,
    )

  return response.data
}