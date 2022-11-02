const { response, request } = require('express')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

require('dotenv').config()
const Person = require('./models/person')

const app = express()

app.use(express.json())
app.use(express.static('build'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :posted'))
app.use(cors())

morgan.token('posted', function(request, response) {
  return JSON.stringify(request.body)
})

// examine all entries
app.get('/api/people', (request, response) => {
  Person.find({}).then(people => {
    response.json(people)
  })
})

// examine single entry
app.get('/api/people/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})


// remove single entry
app.delete('/api/people/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})


// add new person to phonebook
app.post('/api/people', (request, response, next) => {
  const body = request.body

  if (body.name === undefined) {
    return response.status(400).json({error: 'name missing'})
  }

  if (body.number === undefined) {
    return response.status(400).json({error: 'number missing'})
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})

// edit existing person
app.put('/api/people/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, {new: true})
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

// examine info page
app.get('/info', (request, response) => {
  const date = new Date()
  Person.find({}).then(people => {
    const string = JSON.stringify(people)
    const array = JSON.parse(string)
    response.send(`<p>Phonebook has information for ${array.length} people</p>
            ${date}
            <p><a href="/">index</a></p>`)
  })
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// unknown endpoint
const unknownEndpoint = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}

app.use(unknownEndpoint)

// error handler
const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  console.log(error.message)
  
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)