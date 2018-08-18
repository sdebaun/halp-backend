import _ from 'lodash'
import shortid from 'shortid'
import moment from 'moment'
import { PubSub } from 'apollo-server'
import ProjectController from './controllers/project'
import ProjectDetailController from './controllers/projectDetail'
import ProjectSentPersonController from './controllers/projectSentPerson'

const pubsub = new PubSub()

const DEFAULT_PROJECT_COUNTS = {
  active: 0,
  closed: 0,
  old: 0,
}

const PROJECT_ADDED = 'PROJECT_ADDED'
const PROJECT_CHANGED = 'PROJECT_CHANGED'
const PROJECT_DELETED = 'PROJECT_DELETED'

const pushProjectChanged = (db, id) => {
  const projectChanged = ProjectController.get(db, id)
  pubsub.publish(PROJECT_CHANGED, {projectChanged})
  return projectChanged
}

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
      const project = pushProjectChanged(db, id)
      return project
    },

    addProjectDetail: (parent, args, {db}, info) => {
      const id = ProjectDetailController.create(db, args)
      const projectDetail = ProjectDetailController.get(db, id)
      pushProjectChanged(db, args.projectId)
      return projectDetail
    },
    deleteProjectDetail: (parent, {id}, {db}, info) => {
      const projectDetail = ProjectDetailController.get(db, id)
      ProjectDetailController.del(db, id)
      pushProjectChanged(db, projectDetail.projectId)
      return id
    },
    updateProjectDetail: (parent, args, {db}, info) => {
      ProjectDetailController.update(db, args)
      const projectDetail = ProjectDetailController.get(db, args.id)
      pushProjectChanged(db, projectDetail.projectId)
      return projectDetail
    },

    addProjectSentPerson: (parent, args, {db}, info) => {
      const id = ProjectSentPersonController.create(db, args)
      const projectSentPerson = ProjectSentPersonController.get(db, id)
      pushProjectChanged(db, args.projectId)
      return projectSentPerson
    },
    deleteProjectSentPerson: (parent, {id}, {db}, info) => {
      const projectSentPerson = ProjectSentPersonController.get(db, id)
      ProjectSentPersonController.del(db, id)
      pushProjectChanged(db, projectSentPerson.projectId)
      return id
    },
    updateProjectSentPerson: (parent, args, {db}, info) => {
      ProjectSentPersonController.update(db, args)
      const projectSentPerson = ProjectSentPersonController.get(db, args.id)
      pushProjectChanged(db, projectSentPerson.projectId)
      return projectSentPerson
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
