// LocalStorage helpers for Groups list

const STORAGE_KEY = 'GROUPS';

function safeParse(json) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function loadGroups() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export function saveGroups(groups) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(groups) ? groups : []));
  } catch {}
}

export function upsertGroup(group) {
  if (!group || (group.id === undefined && group.custom_url === undefined)) return;
  const idNorm = normalize(group.id);
  const urlNorm = normalize(group.custom_url);

  const current = loadGroups();
  const filtered = (current || []).filter((g) => {
    const gid = normalize(g && g.id);
    const gurl = normalize(g && g.custom_url);
    return gid !== idNorm && (urlNorm ? gurl !== urlNorm : true);
  });
  filtered.push(group);
  saveGroups(filtered);
  return group;
}

export function findGroupByIdOrUrl(idOrUrl) {
  const key = normalize(idOrUrl);
  if (!key) return null;
  const list = loadGroups();
  const found = (list || []).find((g) => normalize(g && g.id) === key || normalize(g && g.custom_url) === key);
  return found || null;
}

export function removeGroupById(id) {
  const key = normalize(id);
  const list = loadGroups();
  const next = (list || []).filter((g) => normalize(g && g.id) !== key);
  saveGroups(next);
}


