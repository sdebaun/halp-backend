import 'babel-polyfill';
import express from 'express';
import { ApolloServer } from 'apollo-server';

import typeDefs from './typeDefs';
import resolvers from './resolvers';
import context from './context';

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  formatResponse: r => {
    console.log(JSON.stringify(r, null, 2))
    return r
  },
  formatError: e => {
    console.log(e)
    return e
  }
})

server.listen({port: 4000}).then(({url, subscriptionsUrl}) => {
  console.log(`Server running on ${url}`)
  console.log(`Graphql Playground running on ${url}graphql`)
  console.log(`Subscriptions running on ${subscriptionsUrl}`)
})

