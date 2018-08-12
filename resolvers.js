import _ from 'lodash'
import shortid from 'shortid'

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

const detailsFor = db => project => {
  const details = db.get('projectDetails')
    .filter({projectId: project.id}).value();
  return {
    ...project,
    details,
  }
}

const scoreFor = db => project => {
  const sentPersonsScore = sentPercentScore(project)
  return {
    ...project,
    sentPersonsScore
  }
}

const sentEquivalentFor = ({sent, confirmed, noshow}) =>
  (sent * 0.5) + (confirmed * 1.0) + (noshow * 0.25)

const sentPercentScore = ({sentPersonsNeeded, sentPersonCounts}) =>
  sentEquivalentFor(sentPersonCounts) / sentPersonsNeeded

const resolvers = {
  Query: {
    getProject: (parent, {id}, {db}, info) => {
      const project = db.get('projects').find({id}).value()
      const sentPersonsAll = db.get('projectSentPersons')
        .filter({projectId: id})
        .sortBy(o => o.name)
      const sentPersonsCount = sentPersonsAll.length
      const sentPersons = {
        sent: sentPersonsAll.filter({state: 'sent'}).value(),
        confirmed: sentPersonsAll.filter({state: 'confirmed'}).value(),
        noshow: sentPersonsAll.filter({state: 'noshow'}).value()
      }
      const sentPersonCounts = _.countBy(sentPersonsAll.value(), 'state')
      const sentPersonsScore = sentPercentScore({sentPersonsNeeded: project.sentPersonsNeeded, sentPersonCounts})
      const details = db.get('projectDetails').filter({projectId: id}).value()
      return {
        ...project,
        details,
        sentPersons,
        sentPersonsCount,
        sentPersonsScore,
        sentPersonCounts: {...DEFAULT_SENTPERSON_COUNTS, ...sentPersonCounts},
      }
    },
    projectsAll: (parent, args, {db}, info) => {
      return db.get('projects').value()
    },
    projectsActive: (parent, args, {db}, info) => {
      return db.get('projects')
        .filter({state: 'active'})
        .sortBy(o => o.needStart)
        .reverse()
        .value()
        .map(countsFor(db))
        .map(detailsFor(db))
        .map(scoreFor(db))
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
    copyProject: (parent, {id}, {db}, info) => {
      const project = db.get('projects').find({id}).value()
      const details = db.get('projectDetails').filter({projectId: id}).value()
      const newId = shortid.generate()
      db.get('projects')
        .push({...project, title: `Copy of ${project.title}`, id: newId, state: 'active'})
        .write()
      details.forEach(detail => {
        const newDetailId = shortid.generate()
        db.get('projectDetails')
          .push({...detail, id: newDetailId, projectId: newId})
          .write()
      });
      return db.get('projects').find({id: newId}).value()
    },
    deleteProject: (parent, {id}, {db}, info) => {
      db.get('projects')
        .remove({id})
        .write()
      db.get('projectDetails')
        .remove({projectId: id})
        .write()
      db.get('projectSentPersons')
        .remove({projectId: id})
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
        .push({id, ...args, state: 'sent'})
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
  }
}

export default resolvers;
