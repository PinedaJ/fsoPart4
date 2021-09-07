const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
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
})

describe('addition of a new blog', () => {
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
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
  
    const blogsAtEnd = await helper.blogsInDb()
  
    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )
  
    const titles = blogsAtEnd.map(r => r.title)
  
    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('updating an individual blog post', () => {
  test('changes that number of likes of a post', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    blogToUpdate.likes = 1234
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .expect(200)
    
    expect(blogsAtStart[0].likes).toBe(1234)
  })
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username is not unique', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is not at least 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('is shorter than the minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is not at least 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'sa',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password is shorter than the minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})