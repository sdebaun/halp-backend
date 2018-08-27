import shortid from 'shortid'

const COLLECTION_NAME = 'projectPerks';

const get = (db, id) =>
  db.get(COLLECTION_NAME).find({id}).value()

const create = (db, args) => {
  const id = shortid.generate()
  db.get(COLLECTION_NAME)
    .push({id, ...args})
    .write()
  return id
}

const update = (db, args) => {
  db.get(COLLECTION_NAME)
    .find({id: args.id})
    .assign(args)
    .write()
  return args.id
}

const del = (db, id) => {
  db.get(COLLECTION_NAME)
    .remove({id})
    .write()
  return id
}

export default {
  get,
  create,
  update,
  del,
}