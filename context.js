import low from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'

const DEFAULTS = {
  projects: [],
  users: [],
  projectDetails: [],
  projectSentPeoples: [],
}

const DB_FILE_NAME = 'db.json'

const connectDb = async () => {
  console.log(`connecting to database at ${DB_FILE_NAME}`)
  const adapter = new FileAsync(DB_FILE_NAME)
  return low(adapter)
    .then(db => {
      db.defaults(DEFAULTS).write()
      return db
    })
}

var _db = null
const getDb = async () => {
  if (!_db) { _db = connectDb() }
  return _db
}

const context = async () => ({
  db: await getDb()
})

export default context