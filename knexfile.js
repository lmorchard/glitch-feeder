module.exports = {

  development: {
    debug: true,
    client: 'sqlite3',
    connection: {
      filename: './.data/sqlite.db'
    },
    //pool: { min: 0, max: 0 },
    useNullAsDefault: true
  },

};