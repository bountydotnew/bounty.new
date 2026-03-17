import { randomInt, randomBytes } from 'node:crypto';

export const generateOTP = (): string => {
    const code = randomInt(100_000, 1_000_000);
    return code.toString().padStart(6, '0');
};

export const generateAccessToken = (): string => {
    return randomBytes(32).toString('hex');
};