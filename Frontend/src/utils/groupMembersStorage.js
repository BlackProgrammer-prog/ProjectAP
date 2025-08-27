// Utilities for caching group members' profiles in localStorage per group

const STORAGE_PREFIX = "GROUP_MEMBERS_";

export function loadGroupMembers(groupId) {
  if (!groupId) return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + String(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load group members from localStorage:", error);
    return [];
  }
}

export function saveGroupMembers(groupId, members) {
  if (!groupId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + String(groupId), JSON.stringify(members || []));
  } catch (error) {
    console.error("Failed to save group members to localStorage:", error);
  }
}

export function upsertGroupMember(groupId, profile) {
  if (!groupId || !profile) return;
  const current = loadGroupMembers(groupId);
  const email = String(profile.email || "").toLowerCase();
  const filtered = (current || []).filter((m) => String((m && m.email) || "").toLowerCase() !== email);
  filtered.push(profile);
  saveGroupMembers(groupId, filtered);
}



