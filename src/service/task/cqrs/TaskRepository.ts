import { AgentStorage, StorageKey } from '@/service/storage/AgentStorage';
import { Task } from '@/service/task/cqrs/Task';
import { propEq } from 'ramda';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';

const STORAGE_FOLDER = 'tasks';
export class TaskRepository {
  readonly tasks: Task<any>[];

  constructor(private readonly storage: AgentStorage) {
    this.tasks = [];
  }

  async store(task: Task<any>) {
    await this.storage.put([STORAGE_FOLDER, task.id], task);
  }

  private async loadTaskFromStorage(
    storageKey: StorageKey
  ): Promise<Task<any>> {
    const taskContents = (await this.storage.get(storageKey)) as Task<any>;
    return new Task(taskContents.id, taskContents.events);
  }

  async rehydrate() {
    // load all tasks from storage
    const taskIdsInStorage = await this.storage.findKeys(STORAGE_FOLDER);

    const taskPromises = taskIdsInStorage.map((storageKey) =>
      this.loadTaskFromStorage(storageKey)
    );

    const rehydratedTasks = await Promise.all(taskPromises);
    const unfinishedTasks = rehydratedTasks.filter((task) => !task.isDone());
    this.tasks.push(...unfinishedTasks);
  }

  add(task: Task<any>) {
    this.tasks.push(task);
  }

  get<S>(id: string): Task<S> | undefined {
    return this.tasks.find(propEq('id', id));
  }

  async update<ET extends string, S>(id: string, event: TaskEvent<ET, S>) {
    const task: Task<S> | undefined = this.get(id);

    if (!task) throw Error('Unknown task ' + id);

    task.events.push(event);

    await this.store(task);
  }
}
