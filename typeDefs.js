import { gql } from 'apollo-server-express';
import { join } from 'upath';
import { readFileSync } from 'fs';

const typeDefs = gql(readFileSync(join(__dirname, "./schema.graphql"), 'utf8'))

export default typeDefs