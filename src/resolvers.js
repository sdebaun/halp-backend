import { PubSub } from 'apollo-server'
import ProjectController from './controllers/project'
import ProjectDetailController from './controllers/projectDetail'
import ProjectSentPersonController from './controllers/projectSentPerson'
import ProjectPerkController from './controllers/projectPerk'

const pubsub = new PubSub()

const PROJECT_ADDED = 'PROJECT_ADDED'
const PROJECT_CHANGED = 'PROJECT_CHANGED'
const PROJECT_DELETED = 'PROJECT_DELETED'
const PROJECTCOUNTS_CHANGED = 'PROJECTCOUNTS_CHANGED'

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
      return ProjectController.counts(db)
    }
  },
  Mutation: {
    createProject: (parent, args, {db}, info) => {
      const id = ProjectController.create(db, args)
      const project = ProjectController.get(db, id)
      pubsub.publish(PROJECT_ADDED, { projectAdded: project })
      const counts = ProjectController.counts(db)
      pubsub.publish(PROJECTCOUNTS_CHANGED, { projectCountsChanged: counts })
      return project
    },
    copyProject: (parent, {id}, {db}, info) => {
      const newId = ProjectController.copy(db, id)
      const project = ProjectController.get(db, newId)
      pubsub.publish(PROJECT_ADDED, { projectAdded: project })
      const counts = ProjectController.counts(db)
      pubsub.publish(PROJECTCOUNTS_CHANGED, { projectCountsChanged: counts })
      return project
    },
    deleteProject: (parent, {id}, {db}, info) => {
      ProjectController.del(db, id)
      pubsub.publish(PROJECT_DELETED, {projectDeleted: id})
      const counts = ProjectController.counts(db)
      pubsub.publish(PROJECTCOUNTS_CHANGED, { projectCountsChanged: counts })
      return id
    },
    updateProject: (parent, args, {db}, info) => {
      const id = ProjectController.update(db, args)
      const project = pushProjectChanged(db, id)
      const counts = ProjectController.counts(db)
      pubsub.publish(PROJECTCOUNTS_CHANGED, { projectCountsChanged: counts })
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

    addProjectPerk: (parent, args, {db}, info) => {
      const id = ProjectPerkController.create(db, args)
      const projectPerk = ProjectPerkController.get(db, id)
      pushProjectChanged(db, args.projectId)
      return projectPerk
    },
    deleteProjectPerk: (parent, {id}, {db}, info) => {
      const projectPerk = ProjectPerkController.get(db, id)
      ProjectPerkController.del(db, id)
      pushProjectChanged(db, projectPerk.projectId)
      return id
    },
    updateProjectDetail: (parent, args, {db}, info) => {
      ProjectPerkController.update(db, args)
      const projectPerk = ProjectPerkController.get(db, args.id)
      pushProjectChanged(db, projectPerk.projectId)
      return projectPerk
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
    },
    projectCountsChanged: {
      subscribe: () => pubsub.asyncIterator([PROJECTCOUNTS_CHANGED])
    }
  }
}

export default resolvers;
