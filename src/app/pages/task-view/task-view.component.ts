import { Component, OnInit } from '@angular/core';
import {TaskService} from "../../task.service";
import {ActivatedRoute, Params} from "@angular/router";
import {List} from "../../models/list.model";
import { Task } from "../../models/task.model";

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {

  lists!: List[];
  tasks!: Task[];

  constructor(private taskService: TaskService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
        this.tasks = tasks;
      })
    })
    this.taskService.getLists().subscribe( (lists: List[]) => {
      this.lists = lists;
    })
  }

  onTaskClick(task: Task) {
    this.taskService.complete(task).subscribe(() => {
      // after setting the task to completed successfully
      console.log("Completed successfully")
      task.completed = !task.completed;

    })
  }
}


