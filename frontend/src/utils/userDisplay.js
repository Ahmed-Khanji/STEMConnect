export function getUserDisplayName(user) {
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User"
  );
}

export function getUserInitials(user) {
  const full = getUserDisplayName(user);
  const parts = full.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "U";
}
