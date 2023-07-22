require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()
app.use(cors())
app.use(express.static('build'))
app.use(express.json())

const tinyFormat = 'tiny'
const tinyMorgan = morgan(tinyFormat, {
  skip: (req) => req.method === 'POST'
})
app.use(tinyMorgan)
morgan.token('body', function (req) { return JSON.stringify(req.body) })
const postFormat = ':method :url :status :res[content-length] - :response-time ms :body'
const postMorgan = morgan(postFormat, {
  skip: (req) => req.method !== 'POST'
})
app.use(postMorgan)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

app.get('/', (req, res) => {
  res.send('<h1>Hello World! This is part3 backend speaking.</h1>')
})

app.get('/info', (req, res) => {
  Person.find({}).then(persons => {
    res.send(`<p>Phonebook has info for ${persons.length} people</p>` + `<p>${new Date().toString()}</p>`)
  })
})

app.get('/api/persons', (req, res) => {
  Person.
    find({})
    .then(persons => {
      console.log(persons)
      res.json(persons)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }})
    .catch(error => next(error))
})

// const generateId = () => {
//   //This is floored because otherwise it will have many decimals
//   const maxId = Math.floor(Math.random() * 100000)
//   return maxId + 1
// }

app.post('/api/persons/', (request, response) => {
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    console.log(savedPerson)
    response.json(savedPerson)
  })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      console.log(result)
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body
  const body = request.body

  Person.findByIdAndUpdate(request.params.id,
    { name, number },
    { new: true, context: 'query' },
  )
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
