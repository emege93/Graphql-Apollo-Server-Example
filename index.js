import { ApolloServer, gql, UserInputError } from "apollo-server";
import axios from "axios";
import { v1 as uuid } from "uuid";

const { data: PersonsFromRestApi } = await axios.get(
  "http://localhost:3000/persons"
);
const persons = PersonsFromRestApi;

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }
  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
  }
`;

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      if (!args.phone) return persons;

      const byPhone = (person) =>
        args.phone === "YES" ? person.phone : !person.phone;

      return persons.filter(byPhone);
    },
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find((person) => person.name === name);
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find((person) => person.name === args.name)) {
        throw new UserInputError("Person already exists", {
          invalidArgs: args.name,
        });
      }
      const person = { ...args, id: uuid() };
      persons.push(person); // update database with new person
      return person;
    },
    editNumber: (root, args) => {
      const { name, phone } = args;
      const personIndex = persons.findIndex((person) => person.name === name);
      if (!personIndex === -1) return null;

      const person = persons[personIndex];

      const updatedPerson = { ...person, phone };
      persons[personIndex] = updatedPerson;

      return updatedPerson;
    },
  },
  Person: {
    address: (root) => {
      const { street, city } = root;
      return { street, city };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
