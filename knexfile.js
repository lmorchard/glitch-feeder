module.exports = {
  development: {
    debug: true,
    client: 'sqlite3',
    connection: {
      filename: './.data/sqlite.db'
    },
    useNullAsDefault: true
  },
};