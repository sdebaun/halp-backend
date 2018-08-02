
const resolvers = {
  Query: {
    projectsAll: (parent, object, {db}, info) => {
      return db.get('projects').value()
    },
    project: (parent, {id}, {db}, info) => {
      return db.get('projects').find({id}).value()
    }
  }
}

export default resolvers;
