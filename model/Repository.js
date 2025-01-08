import mongoose from "mongoose"

const repositorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  forksCount: {
    type: Number,
    required: true,
  },
  stargazersCount: {
    type: Number,
    required: true,
  },
  ratingAverage: {
    type: Number,
    required: true,
  },
  reviewCount: {
    type: Number,
    required: true,
  },
  ownerAvatarUrl: {
    type: String,
    required: false,
  },
})

export default mongoose.model("Repositories", repositorySchema, "Repositories")
