export const grim = () => ({
  log: (...args: unknown[]) => console.log('%c[grim::log]', 'color: white', ...args),
  info: (...args: unknown[]) => console.info('%c[grim::info]', 'color: grey', ...args),
  warn: (...args: unknown[]) => console.warn('%c[grim::warn]', 'color: yellow', ...args),
  error: (...args: unknown[]) => console.error('%c[grim::error]', 'color: red', ...args),
}); 