import { EventEmitter } from "events"

export class mockTaskQueue extends EventEmitter {

  jobs: any = {}
  concurrentTasks: number = 1

  empty = async () => {
    this.jobs = []
  }

  add = async (task: any, options: any) => {
    const id = options.jobId
    this.jobs[id] = {
      status: 'new',
      id,
      data: task,
      remove: async () => {
        this.emit('global:failed', id)
        delete this.jobs[id]
      }
    }
    return this.jobs[id]
  }

  getJob = async (id: string) => {
    return this.jobs[id]
  }

  close = async () => {
  }

  process = (concurrentTasks: number, func: any) => {
    this.concurrentTasks = concurrentTasks
    setInterval(async () => {
      const activeJobs = Object.keys(this.jobs).filter(key => this.jobs[key].status === "working")
      if (activeJobs.length < this.concurrentTasks) {
        const newTasksIds = Object.keys(this.jobs).filter(key => this.jobs[key].status === "new")
        if (newTasksIds.length > 0) {
          this.jobs[newTasksIds[0]].status = 'working'
          try {
            await func(this.jobs[newTasksIds[0]], ()=>{
              this.emit('global:failed', newTasksIds[0])
              delete this.jobs[newTasksIds[0]]
            })
          } catch {
            // console.log('exec failed')
          }
        }
      }
    },100)
  }
}