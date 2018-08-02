import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import typeDefs from './typeDefs';
import resolvers from './resolvers';
import context from './context';

const app = express();
const server = new ApolloServer({typeDefs, resolvers, context})
server.applyMiddleware({app})

app.listen({port: 4000}, () => {
  console.log(`Server running on http://localhost:4000${server.graphqlPath}`)
})
