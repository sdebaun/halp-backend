import shortid from 'shortid'
import moment from 'moment'

const get = (db, id) =>
  db.get('projectSentPersons').find({id}).value()

const create = (db, args) => {
  const id = shortid.generate()
  db.get('projectSentPersons')
    .push({id, ...args, createdAt: moment()})
    .write()
  return id
}

const update = (db, {id, state}) => {
  db.get('projectSentPersons')
    .find({id})
    .assign({state})
    .write()
  return id
}
const del = (db, id) => {
  db.get('projectSentPersons')
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