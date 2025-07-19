const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log("%c[grim::log]", "color: #7a7a7a; font-weight: bold;", ...args);
  }
};

const error = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error("%c[grim::error]", "color: #ef4444; font-weight: bold;", ...args);
  }
};

const warn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn("%c[grim::warn]", "color: #f59e0b; font-weight: bold;", ...args);
  }
};

const info = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.info("%c[grim::info]", "color: #10b981; font-weight: bold;", ...args);
  }
};

export const grim = () => {
  return { log, error, warn, info }; 
};