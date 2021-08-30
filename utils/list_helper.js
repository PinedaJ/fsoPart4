var _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  let sum = 0
  blogs.forEach(blog => {
    sum += blog.likes
  })
  return sum
}

const favoriteBlog = (blogs) => {
  let favBlog = {}
  
  blogs.forEach(blog => {
    if (typeof(favBlog.likes) !== "number") {
      favBlog = blog
    }
    if (blog.likes > favBlog.likes) {
      favBlog = blog
    } 
  })

  favBlog = {
    title: favBlog.title,
    author: favBlog.author,
    likes: favBlog.likes
  }
  return favBlog 
}

const mostBlogs = (blogs) => {
  const authors = []
  blogs.forEach(blog => {
    authors.push(blog.author)
  })
  
  const nameMostBlogs = _.maxBy(authors)
  if (typeof(nameMostBlogs) === "undefined") {
    return {}
  }

  let numBlogs = 0
  authors.forEach(author => {
    if (author === nameMostBlogs) {
      numBlogs++
    }
  })

  const authorMostBlogs = {
    author: nameMostBlogs,
    blogs: numBlogs
  }
  console.log(authorMostBlogs)

  return authorMostBlogs
}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs
}