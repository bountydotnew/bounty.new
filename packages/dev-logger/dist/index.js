"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grim = void 0;
const grim = () => ({
    log: (...args) => console.log('%c[grim::log]', 'color: white', ...args),
    info: (...args) => console.info('%c[grim::info]', 'color: grey', ...args),
    warn: (...args) => console.warn('%c[grim::warn]', 'color: yellow', ...args),
    error: (...args) => console.error('%c[grim::error]', 'color: red', ...args),
});
exports.grim = grim;
