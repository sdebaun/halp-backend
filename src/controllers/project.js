import _ from 'lodash'
import shortid from 'shortid'

const DEFAULT_PROJECT_COUNTS = {
  active: 0,
  closed: 0,
  old: 0,
}

const DEFAULT_SENTPERSON_COUNTS = {
  sent: 0,
  confirmed: 0,
  noshow: 0
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

const perksFor = db => project => {
  const perks = db.get('projectPerks')
    .filter({projectId: project.id}).value();
  return {
    ...project,
    perks,
  }
}

const scoreFor = db => project => {
  const sentPersonsScore = sentPercentScore(project)
  return {
    ...project,
    sentPersonsScore
  }
}

const sentPercentScore = ({sentPersonsNeeded, sentPersonCounts}) =>
  sentEquivalentFor(sentPersonCounts) / sentPersonsNeeded

const sentEquivalentFor = ({sent, confirmed, noshow}) =>
  (sent * 0.5) + (confirmed * 1.0) + (noshow * 0.25)

const get = (db, id) => {
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
  const perks = db.get('projectPerks').filter({projectId: id}).value()
  return {
    ...project,
    details,
    perks,
    sentPersons,
    sentPersonsCount,
    sentPersonsScore,
    sentPersonCounts: {...DEFAULT_SENTPERSON_COUNTS, ...sentPersonCounts},
  }
}

const all = db => db.get('projects').value()

const byState = (db, state) =>
  db.get('projects')
    .filter({state})
    .sortBy(o => o.needStart)
    .reverse()
    .value()
    .map(countsFor(db))
    .map(detailsFor(db))
    .map(perksFor(db))
    .map(scoreFor(db))

const counts = (db) => {
  const projects = db.get('projects').value()
  const counts = _.countBy(projects, 'state')
  return {...DEFAULT_PROJECT_COUNTS, ...counts}
}

const create = (db, args) => {
  const id = shortid.generate()
  db.get('projects')
    .push({id, state: 'active', ...args})
    .write()
  return id
}

const update = (db, args) => {
  db.get('projects')
    .find({id: args.id})
    .assign(args)
    .write()
  return args.id
}

const copy = (db, id) => {
  const project = db.get('projects').find({id}).value()
  const details = db.get('projectDetails').filter({projectId: id}).value()
  const perks = db.get('projectPerks').filter({projectId: id}).value()
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
  perks.forEach(perk => {
    const newPerkId = shortid.generate()
    db.get('projectPerks')
      .push({...perk, id: newPerkId, projectId: newId})
      .write()
  });
  return newId
}

const del = (db, id) => {
  db.get('projects')
    .remove({id})
    .write()
  db.get('projectDetails')
    .remove({projectId: id})
    .write()
  db.get('projectPerks')
    .remove({projectId: id})
    .write()
  db.get('projectSentPersons')
    .remove({projectId: id})
    .write()
  return id
}

export default {
  get,
  byState,
  all,
  counts,
  create,
  copy,
  update,
  del,
}