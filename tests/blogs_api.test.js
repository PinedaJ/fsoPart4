const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('making an HTTP POST req to /api/blogs creates a new blog post', async () => {
  const newBlog = {
    title: "TDD harms architecture 2",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture-2.html",
    likes: 2
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(b => b.title)
  expect(titles).toContain(
    'TDD harms architecture 2'
  )

  const authors = blogsAtEnd.map(b => b.author)
  expect(authors).toContain(
    'Robert C. Martin'
  )

  const urls = blogsAtEnd.map(b => b.url)
  expect(urls).toContain(
    'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture-2.html'
  )

  const likess = blogsAtEnd.map(b => b.likes)
  expect(likess).toContain(
    2
  )
})

test('blog without likes is given a value of 0', async () => {
  const newBlog = {
    title: "TDD harms architecture 3",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture-2.html",
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const likess = blogsAtEnd.map(b => b.likes)
  expect(likess[helper.initialBlogs.length]).toBe(0)
})

test('blog without title or url is not added', async () => {
  const newBlogNoTitle = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture-2.html",
  }
  
  const newBlogNoUrl = {
    title: "TDD harms architecture 3",
    author: "Robert C. Martin",
  }

  await api
    .post('/api/blogs')
    .send(newBlogNoTitle)
    .expect(400)
  
  await api
    .post('/api/blogs')
    .send(newBlogNoUrl)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

afterAll(() => {
  mongoose.connection.close()
})