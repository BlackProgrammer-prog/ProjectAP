// Utilities for managing Groups cache in localStorage

const GROUPS_STORAGE_KEY = "GROUPS";

export function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load GROUPS from localStorage:", error);
    return [];
  }
}

export function saveGroups(groups) {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups || []));
  } catch (error) {
    console.error("Failed to save GROUPS to localStorage:", error);
  }
}

export function upsertGroup(group) {
  if (!group || !group.id) return;
  const current = loadGroups();
  const next = (current || []).filter((g) => g && g.id !== group.id);
  next.push(group);
  saveGroups(next);
}

export function getStoredGroupIds() {
  const current = loadGroups();
  return (current || [])
    .map((g) => g && (g.id || g.custom_url))
    .filter((id) => typeof id === "string" && id.length > 0);
}

export function findGroupByIdOrUrl(idOrUrl) {
  const current = loadGroups();
  return (current || []).find(
    (g) => g && (g.id === idOrUrl || g.custom_url === idOrUrl)
  );
}


