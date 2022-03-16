import { taskQueue } from "../src/taskqueue"

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

jest.setTimeout(50000)

test('test-queue', async () => {

  taskQueue.cleanTasks()
  taskQueue.processTasks()

  taskQueue.queue.on('global:completed', (completed) => {
    console.log('completed', completed, new Date())
  })

  taskQueue.queue.concurrentTasks = 2
  
  const job1 = await taskQueue.addTask({type: 'Blank', id: '1'})
  const job2 = await taskQueue.addTask({type: 'Blank', id: '2'})
  const job3 = await taskQueue.addTask({type: 'Blank', id: '3'})
  const job4 = await taskQueue.addTask({type: 'Blank', id: '4'})

  await waitFor(10000)
  await taskQueue.cleanTasks()
  await taskQueue.queue.close()
})