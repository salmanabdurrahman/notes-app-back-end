import { config } from 'dotenv';

process.env.NODE_ENV = 'test';

config();

process.env.ACCESS_TOKEN_KEY ||= 'test-access-token-key';
process.env.REFRESH_TOKEN_KEY ||= 'test-refresh-token-key';
