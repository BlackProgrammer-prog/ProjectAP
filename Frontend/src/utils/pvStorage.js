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
  const without = current.filter((p) => p && p.email !== profile.email);
  const updated = [...without, profile];
  savePV(updated);
}

export function getStoredEmails() {
  const current = loadPV();
  return current
    .map((p) => p && p.email)
    .filter((email) => typeof email === "string" && email.length > 0);
}



