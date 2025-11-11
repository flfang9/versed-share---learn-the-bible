import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useReadingStats({ deviceId, enabled = true }) {
  return useQuery({
    queryKey: ["reading-stats", deviceId],
    enabled: Boolean(deviceId) && enabled,
    queryFn: async () => {
      const params = new URLSearchParams({ deviceId });
      const res = await fetch(`/api/reading/stats?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/reading/stats, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });
}

export function useLogReadingActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/reading/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Silently fail if endpoint doesn't exist (404) - backend may not be set up yet
      if (!res.ok && res.status !== 404) {
        throw new Error(
          `When posting /api/reading/activity, the response was [${res.status}] ${res.statusText}`,
        );
      }
      // Return empty object for 404 to avoid errors
      if (res.status === 404) {
        return {};
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      const deviceId = variables?.deviceId;
      if (deviceId) {
        qc.invalidateQueries({ queryKey: ["reading-stats", deviceId] });
      }
    },
    // Don't show errors for 404 - endpoint may not exist yet
    onError: (error) => {
      if (!error.message?.includes('[404]')) {
        console.error("[Stats] activity log error", error);
      }
    },
  });
}
