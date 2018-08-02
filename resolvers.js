import _ from 'lodash'
import shortid from 'shortid'

const resolverFor = (collName, query) =>
  (parent, args, {db}, info) => query(db.get(collName), args).value()

const DEFAULT_SENTPERSON_COUNTS = {
  sent: 0,
  confirmed: 0,
  noshow: 0
}

const DEFAULT_PROJECT_COUNTS = {
  active: 0,
  closed: 0,
  old: 0,
}

const countsFor = db => project => {
  const sentPersons = db.get('projectSentPersons')
    .filter({projectId: project.id}).value();
  const sentPersonCounts = _.countBy(sentPersons, 'state');
  return {
    ...project,
    sentPersonCounts: {...DEFAULT_SENTPERSON_COUNTS, ...sentPersonCounts}
  }
}

const resolvers = {
  Query: {
    getProject: (parent, {id}, {db}, info) => {
      const project = db.get('projects').find({id}).value()
      const sentPersons = db.get('projectSentPersons').filter({projectId: id}).value()
      const sentPersonCounts = _.countBy(sentPersons, 'state')
      const details = db.get('projectDetails').filter({projectId: id}).value()
      return {
        ...project,
        details,
        sentPersons,
        sentPersonCounts: {...DEFAULT_SENTPERSON_COUNTS, ...sentPersonCounts},
      }
    },
    projectsAll: (parent, args, {db}, info) => {
      return db.get('projects').value()
    },
    projectsActive: (parent, args, {db}, info) => {
      return db.get('projects').filter({state: 'active'}).value().map(countsFor(db))
    },
    projectCounts: (parent, args, {db}, info) => {
      const projects = db.get('projects').value()
      const counts = _.countBy(projects, 'state')
      return {...DEFAULT_PROJECT_COUNTS, ...counts}
    }
  },
  Mutation: {
    createProject: (parent, args, {db}, info) => {
      const id = shortid.generate()
      db.get('projects')
        .push({id, state: 'active', ...args})
        .write()
      return db.get('projects').find({id}).value()
    },
    deleteProject: (parent, {id}, {db}, info) => {
      db.get('projects')
        .remove({id})
        .write()
      return id
    },
    updateProject: (parent, args, {db}, info) => {
      db.get('projects')
        .find({id: args.id})
        .assign(args)
        .write()
        return db.get('projects').find({id: args.id}).value()
    },
    addProjectDetail: (parent, args, {db}, info) => {
      const id = shortid.generate()
      db.get('projectDetails')
        .push({id, ...args})
        .write()
      return db.get('projectDetails').find({id}).value()
    },
    deleteProjectDetail: (parent, {id}, {db}, info) => {
      db.get('projectDetails')
        .remove({id})
        .write()
      return id
    }
  }
}

export default resolvers;
