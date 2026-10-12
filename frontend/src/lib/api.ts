export const API_BASE = "";

export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("projectx_token") : null;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errData = await res.json();
      errMessage = errData.detail || errMessage;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json();
}

// Auth API
export async function demoLogin(role: string) {
  const data = await fetchJson<{ token: string; user: any }>("/api/v1/auth/demo", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem("projectx_token", data.token);
    localStorage.setItem("projectx_user", JSON.stringify(data.user));
  }
  return data;
}

export async function getMe() {
  return fetchJson<{ id: string; email: string; role: string; name: string }>("/api/v1/auth/me");
}

// Command & Registers
export async function getCommandGlance() {
  return fetchJson<any>("/api/v1/command/glance");
}

export async function getBases() {
  return fetchJson<any[]>("/api/v1/registers/bases");
}

export async function getFleet() {
  return fetchJson<any[]>("/api/v1/registers/fleet");
}

export async function getCrew() {
  return fetchJson<any[]>("/api/v1/registers/crew");
}

export async function getStores() {
  return fetchJson<any[]>("/api/v1/registers/stores");
}

export async function getMissions() {
  return fetchJson<any[]>("/api/v1/registers/missions");
}

// Plan & ATO
export async function getCurrentPlan() {
  return fetchJson<any>("/api/v1/plan/current");
}

export async function optimisePlan(posture = "BALANCED") {
  return fetchJson<any>("/api/v1/plan/optimise", {
    method: "POST",
    body: JSON.stringify({ posture }),
  });
}

export async function validatePlan() {
  return fetchJson<any>("/api/v1/plan/validate", { method: "POST" });
}

export async function approvePlan() {
  return fetchJson<any>("/api/v1/plan/approve", { method: "POST" });
}

export async function cosignPlan() {
  return fetchJson<any>("/api/v1/plan/cosign", { method: "POST" });
}

export async function publishPlan() {
  return fetchJson<any>("/api/v1/plan/publish", { method: "POST" });
}

// Sensor Fusion
export async function getFeeds() {
  return fetchJson<any[]>("/api/v1/fusion/feeds");
}

export async function toggleFeed(feed_id: string, status: string) {
  return fetchJson<any>("/api/v1/fusion/toggle", {
    method: "POST",
    body: JSON.stringify({ feed_id, status }),
  });
}

export async function getConflicts() {
  return fetchJson<any[]>("/api/v1/fusion/conflicts");
}

export async function resolveConflict(id: number) {
  return fetchJson<any>(`/api/v1/fusion/conflicts/${id}/resolve`, { method: "POST" });
}

// Retask & Disruptions
export async function injectDisruption(type: string, severity = "HIGH", payload: any = {}) {
  return fetchJson<any>("/api/v1/retask/inject", {
    method: "POST",
    body: JSON.stringify({ type, severity, payload }),
  });
}

export async function getEvents() {
  return fetchJson<any[]>("/api/v1/retask/events");
}

export async function getCoas() {
  return fetchJson<any[]>("/api/v1/retask/coas");
}

export async function applyCoa(coa_id: string) {
  return fetchJson<any>("/api/v1/retask/apply", {
    method: "POST",
    body: JSON.stringify({ coa_id }),
  });
}

// ML Analytics
export async function getAircraftDegradation(tail: string) {
  return fetchJson<any>(`/api/v1/analytics/aircraft-degradation?tail=${encodeURIComponent(tail)}`);
}

export async function getFleetForecast() {
  return fetchJson<any>("/api/v1/analytics/fleet-forecast");
}

export async function evaluateRisk(features: any) {
  return fetchJson<any>("/api/v1/analytics/operational-risk", {
    method: "POST",
    body: JSON.stringify(features),
  });
}

// C2 Copilot
export async function askCopilot(query: string, operator_role = "commander") {
  return fetchJson<any>("/api/v1/copilot/query", {
    method: "POST",
    body: JSON.stringify({ query, operator_role }),
  });
}

// Audit Trail
export async function getAuditEntries() {
  return fetchJson<any[]>("/api/v1/audit/entries");
}

export async function verifyAuditChain() {
  return fetchJson<any>("/api/v1/audit/verify", { method: "POST" });
}
