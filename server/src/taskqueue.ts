// load config
import { config } from "./config/config"
import models from "./models"
import Queue from "bull"
import { mockTaskQueue } from "./mockTaskqueue"
import debug from "debug"

// debug
const log = debug("trader:taskqueue")

// tasks
import TradeSession from "./tasks/tradesession"
import BacktestSession from "./tasks/backtestsession"
import FollowSession from "./tasks/followsession"
import Blank from "./tasks/blank"

// list tasks
const loadTask = {
  TradeSession,
  BacktestSession,
  FollowSession,
  Blank
};

class TaskQueue {

  data;
  finished;
  queue;

  constructor() {
    if (config.redis !== undefined) {
      this.queue = new Queue("queue", {
        redis: {
          port: 6379,
          host: config.redis.host
        },
        settings: {
          stalledInterval: 0
        }
      })
    } else {
      this.queue = new mockTaskQueue()
    }
  }

  addTask = async (task) => {
    return this.queue.add(task, {jobId: task.id})
  }

  stopTask = async (id) => {
    const job = await this.queue.getJob(id)
    if (job) {
      try {
        await job.moveToCompleted()
      } catch (e) {
        // update to completed
      }
    } else {
      await models.tradesessions.update({
        ended: Date.now()
      },{
        where: {
          id: id
        }
      })
    }
  }

  processTasks() {
    this.queue.process(config.app.concurrentTasks, async (job: any, done: any) => {
      const task = new loadTask[job.data.type](job)
      task.load().then(() => {
        done()
      })
    })
  }

}

export const taskQueue = new TaskQueue()