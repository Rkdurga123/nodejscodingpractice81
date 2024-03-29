const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let database = null
const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DataBase error is ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT * FROM todo  WHERE todo LIKE '%${search_q}%'and status = '${status}' AND priority = '${priority}';`
      break

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE todo LIKE '%${search_q}%' and priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' and status = '${status}';`
      break

    default:
      getTodosQuery = `select * from todo WHERE todo LIKE '%${search_q}%' and priority = '${priority}' and status = '${status}';`
      data = await database.all(getTodosQuery)
      response.send(data)
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `select * from todo where id=${todoId};`
  const responseResult = await database.get(getToDoQuery)
  response.send(responseResult)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo,priority, status)
  VALUES
    (${id}, '${todo}','${priority}', '${status}');`
  await database.run(postTodoQuery)

  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break

    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break

    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id=${todoId};`
  const previousTodo = await database.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `UPDATE todo SET  todo='${todo}', priority='${priority}', status='${status}' WHERE id=${todoId};
    `
  await database.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
