// Utilities for managing the PV (profiles) cache in localStorage

const PV_STORAGE_KEY = "PV";

export function loadPV() {
  try {
    const raw = localStorage.getItem(PV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load PV from localStorage:", error);
    return [];
  }
}

export function savePV(profiles) {
  try {
    localStorage.setItem(PV_STORAGE_KEY, JSON.stringify(profiles || []));
  } catch (error) {
    console.error("Failed to save PV to localStorage:", error);
  }
}

export function upsertProfile(profile) {
  if (!profile || !profile.email) return;
  const current = loadPV();
  const existing = (current || []).find((p) => p && p.email === profile.email) || null;
  // Merge while preserving customUrl and other local-only fields if missing in incoming profile
  const merged = existing
    ? {
        ...existing,
        ...profile,
        customUrl: profile.customUrl || existing.customUrl,
        status: typeof profile.status !== 'undefined' ? profile.status : existing.status,
      }
    : profile;
  const next = (current || []).filter((p) => p && p.email !== profile.email);
  next.push(merged);
  savePV(next);
}

export function getStoredEmails() {
  const current = loadPV();
  return current
    .map((p) => p && p.email)
    .filter((email) => typeof email === "string" && email.length > 0);
}



