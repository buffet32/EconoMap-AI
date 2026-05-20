export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.user || parsed;
  } catch {
    return null;
  }
}

export function hasPremiumAccess(user) {
  if (!user) return false;
  return Boolean(
    user.is_premium ||
    user.subscription_type === 'premium' ||
    user.role === 'admin' ||
    user.role === 'responsable'
  );
}

export function requireAuth(navigate) {
  const user = getStoredUser();
  if (!user) {
    navigate('/login');
    return null;
  }
  return user;
}
