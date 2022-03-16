const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))

export default class Blank {

  finished
  options

  constructor(job: any) {
    this.options = job.data
  }

  load = () => {
    return new Promise((resolve) => {
      this.finished = resolve
      this.startTask()
    });
  }

  startTask = async () => {
    await waitFor(2000)
    this.close()
  }

  close = () => {
    this.finished()
  }

}
