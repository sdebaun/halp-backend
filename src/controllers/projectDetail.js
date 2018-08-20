import shortid from 'shortid'

const get = (db, id) =>
  db.get('projectDetails').find({id}).value()

const create = (db, args) => {
  const id = shortid.generate()
  db.get('projectDetails')
    .push({id, ...args})
    .write()
  return id
}

const update = (db, args) => {
  db.get('projectDetails')
    .find({id: args.id})
    .assign(args)
    .write()
  return args.id
}

const del = (db, id) => {
  db.get('projectDetails')
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