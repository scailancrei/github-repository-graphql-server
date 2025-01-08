import { ApolloServer } from "@apollo/server"
import jwt from "jsonwebtoken"
import { GraphQLError } from "graphql"
import { v4 as uuidv4 } from "uuid"
import { startStandaloneServer } from "@apollo/server/standalone"
import bcrypt from "bcrypt"
import mongoose from "mongoose"
import Repository from "./model/Repository.js"
import User from "./model/User.js"

const MONGODB_URI = process.env.MONGODB_URI
mongoose
  .connect(MONGODB_URI, {
    dbName: "Graphql",
  })
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.log("error connecting to mongodb", err.message)
  })

const typeDefs = `
    type User {
      id: ID!
      email: String!
      password: String!
    }
    type Token {
      value: String!
    }
    type Repository {
      id: ID!
      fullName: String!
      description: String!
      language: String!
      forksCount: Int!
      stargazersCount: Int!
      ratingAverage: Int!
      reviewCount: Int!
      ownerAvatarUrl: String
    }
   type Query {
    repositoriesCount: Int!
    allRepositories: [Repository!]!
    allUsers: [User!]!
  }
  type Mutation {
    createUser(email: String!, password: String!): User
    login(email: String!, password: String!): Token
    createRepository(fullName: String!, description: String!, language: String!, forksCount: Int!, stargazersCount: Int!, ratingAverage: Int!, reviewCount: Int!, ownerAvatarUrl: String): Repository
  }
  
`

const resolvers = {
  Query: {
    repositoriesCount: async () =>
      Repository.db.collection("Repositories").countDocuments(),
    allRepositories: async (root, args) =>
      Repository.db.collection("Repositories").find({}).toArray(),
    allUsers: async (root, args) =>
      User.db.collection("Users").find({}).toArray(),
  },
  Mutation: {
    createRepository: async (root, args) => {
      const repository = { id: uuidv4(), ...args }
      if (
        !repository.fullName ||
        !repository.description ||
        !repository.language ||
        !repository.forksCount ||
        !repository.ratingAverage ||
        !repository.stargazersCount ||
        !repository.reviewCount
      ) {
        throw new GraphQLError("Missing required fields")
      }

      const newRepository = await Repository.create(repository)

      return newRepository
    },
    createUser: async (root, args) => {
      const user = await User.findOne({ email: args.email })
      if (user) {
        throw new GraphQLError("Email already exists")
      }
      if (!args.password) {
        throw new GraphQLError("Password is required")
      }
      if (args.password.length < 8) {
        throw new GraphQLError("Password must be at least 8 characters")
      }

      const hashedPassword = await bcrypt.hash(args.password, 10)
      let id = uuidv4()

      const newUser = new User({
        id: id,
        email: args.email,
        password: hashedPassword,
      })
      return newUser.save()
    },
    login: async (root, args) => {
      const user = await User.findOne({ email: args.email })

      const correctPassword =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.password)

      if (!(user && correctPassword)) {
        throw new GraphQLError("Incorrect email or password")
      }
      const userToken = {
        email: user.email,
        id: user.id,
      }

      const token = jwt.sign(userToken, process.env.SECRET_KEY)

      let tokenValue = {
        value: token,
      }
      return tokenValue
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
})

console.log(`Server ready at ${url}`)
