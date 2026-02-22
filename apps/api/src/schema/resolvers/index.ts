import { GraphQLScalarType, Kind } from "graphql";
import { userResolvers } from "./user.resolver";
import { serviceResolvers } from "./service.resolver";
import { containerResolvers } from "./container.resolver";
import { serverResolvers } from "./server.resolver";
import { domainResolvers } from "./domain.resolver";
import { billingResolvers } from "./billing.resolver";
import { couponResolvers } from "./coupon.resolver";
import { adminResolvers } from "./admin.resolver";

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime scalar type",
  serialize(value) {
    if (value instanceof Date) return value.toISOString();
    return value;
  },
  parseValue(value) {
    if (typeof value === "string") return new Date(value);
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "JSON scalar type",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return JSON.parse(ast.value);
    if (ast.kind === Kind.OBJECT) return ast;
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  Query: {
    ...userResolvers.Query,
    ...serviceResolvers.Query,
    ...serverResolvers.Query,
    ...domainResolvers.Query,
    ...billingResolvers.Query,
    ...adminResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...serviceResolvers.Mutation,
    ...containerResolvers.Mutation,
    ...serverResolvers.Mutation,
    ...domainResolvers.Mutation,
    ...billingResolvers.Mutation,
    ...couponResolvers.Mutation,
    ...adminResolvers.Mutation,
  },
  Subscription: {
    ...serviceResolvers.Subscription,
  },
};
