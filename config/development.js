const host = process.env.DB_HOST || 'localhost';

module.exports = {
  server: {
    port: 3000
  },
  key: {
    auth: 'db',
    privateKey: '37LvDSm4XvjYOh9Y',
    tokenExpireInMinutes: 5
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10
  }
};