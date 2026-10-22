export function readCookie(name: string): string | undefined {
  return document.cookie.split('; ').find(part => part.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Max-Age=31536000; Path=/; SameSite=Strict${location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
}

export const preferenceCookies = ['feedbacker-language', 'feedbacker-theme', 'feedbacker-preferences', 'feedbacker-prompt', 'feedbacker-tour'];
