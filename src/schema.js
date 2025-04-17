import { faker } from "@faker-js/faker";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
} from "graphql";

faker.seed(18);

const createRandomUser = () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  zodiac: faker.person.zodiacSign(),
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    zodiac: { type: GraphQLString },
  },
});

const userData = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: () => userData,
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        name: { type: GraphQLString },
        zodiac: { type: GraphQLString },
      },
      resolve: function (_, { name, zodiac }) {
        const user = {
          id: userData[userData.length - 1].id + 1,
          name,
          zodiac,
        };

        userData.push(user);
        return user;
      },
    },
    editUser: {
      type: UserType,
      args: {
        name: { type: GraphQLString },
        id: { type: GraphQLID },
        zodiac: { type: GraphQLString },
      },
      resolve: function (_, { name, zodiac, id }) {
        const user = {
          id,
          name,
          zodiac,
        };
        userData[id] = user;
        return user;
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});
