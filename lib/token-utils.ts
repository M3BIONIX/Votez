
export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token');
  if (token) {
    return token;
  }
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('auth_token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  return null;
}


export function setToken(token: string): void {
  if (typeof document === 'undefined') return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  document.cookie = `auth_token=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  
  localStorage.setItem('auth_token', token);
}


export function clearToken(): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('auth_token');
}


export function dispatchLogoutEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

