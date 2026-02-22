import { createSchema } from "graphql-yoga";
import { typeDefs } from "./typeDefs/index";
import { resolvers } from "./resolvers/index";

export const schema = createSchema({
  typeDefs,
  resolvers,
});
