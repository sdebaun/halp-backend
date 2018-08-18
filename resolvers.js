import _ from 'lodash'
import shortid from 'shortid'
import moment from 'moment'
import { PubSub } from 'apollo-server'
import ProjectController from './controllers/project'

const pubsub = new PubSub()

const DEFAULT_PROJECT_COUNTS = {
  active: 0,
  closed: 0,
  old: 0,
}

const PROJECT_ADDED = 'PROJECT_ADDED'
const PROJECT_CHANGED = 'PROJECT_CHANGED'
const PROJECT_DELETED = 'PROJECT_DELETED'

const resolvers = {
  Query: {
    getProject: (parent, {id}, {db}, info) => {
      return ProjectController.get(db, id)
    },
    projectsAll: (parent, args, {db}, info) => {
      return ProjectController.all(db)
    },
    projectsActive: (parent, args, {db}, info) => {
      return ProjectController.byState(db, 'active')
    },
    projectsByState: (parent, {state}, {db}, info) => {
      return ProjectController.byState(db, state)
    },
    projectCounts: (parent, args, {db}, info) => {
      const projects = db.get('projects').value()
      const counts = _.countBy(projects, 'state')
      return {...DEFAULT_PROJECT_COUNTS, ...counts}
    }
  },
  Mutation: {
    createProject: (parent, args, {db}, info) => {
      const id = ProjectController.create(db, args)
      const project = ProjectController.get(db, id)
      pubsub.publish(PROJECT_ADDED, { projectAdded: project })
      return project
    },
    copyProject: (parent, {id}, {db}, info) => {
      const newId = ProjectController.copy(db, id)
      const project = ProjectController.get(db, newId)
      pubsub.publish(PROJECT_ADDED, { projectAdded: project })
      return project
    },
    deleteProject: (parent, {id}, {db}, info) => {
      ProjectController.del(db, id)
      pubsub.publish(PROJECT_DELETED, {projectDeleted: id})
      return id
    },
    updateProject: (parent, args, {db}, info) => {
      const id = ProjectController.update(db, args)
      const project = ProjectController.get(db, id)
      pubsub.publish(PROJECT_CHANGED, {projectChanged: project})
      return project
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
    },
    updateProjectDetail: (parent, args, {db}, info) => {
      db.get('projectDetails')
        .find({id: args.id})
        .assign(args)
        .write()
        return db.get('projectDetails').find({id: args.id}).value()
    },
    addProjectSentPerson: (parent, args, {db}, info) => {
      const id = shortid.generate()
      db.get('projectSentPersons')
        .push({id, ...args, createdAt: moment()})
        .write()
      return db.get('projectSentPersons').find({id}).value()
    },
    deleteProjectSentPerson: (parent, {id}, {db}, info) => {
      db.get('projectSentPersons')
        .remove({id})
        .write()
      return id
    },
    updateProjectSentPerson: (parent, {id, state}, {db}, info) => {
      db.get('projectSentPersons')
        .find({id})
        .assign({state})
        .write()
      return db.get('projectSentPersons').find({id}).value()
    },
  },
  Subscription: {
    projectAdded: {
      subscribe: () => pubsub.asyncIterator([PROJECT_ADDED])
    },
    projectChanged: {
      subscribe: () => pubsub.asyncIterator([PROJECT_CHANGED])
    },
    projectDeleted: {
      subscribe: () => pubsub.asyncIterator([PROJECT_DELETED])
    }
  }
}

export default resolvers;
