import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";
import { createTaskController } from "./presentation/task/create-task-controller";
import { editTaskTitleController } from "./presentation/task/edit-task-title-controller";
import { getTaskController } from "./presentation/task/get-task-controller";
import { getTaskListController } from "./presentation/task/get-task-list-controller";
import { setTaskDoneController } from "./presentation/task/set-task-done-controller";
import { updateTaskProgressController } from "./presentation/task/update-task-progress-controller";
import { createTeamController } from "./presentation/team/create-team-controller";

const app = new Hono();

app.route("/", getTaskController);
app.route("/", getTaskListController);
app.route("/", createTaskController);
app.route("/", editTaskTitleController);
app.route("/", setTaskDoneController);
app.route("/", updateTaskProgressController);
app.route("/", createTeamController);

const port = 3000;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

if (import.meta.hot) {
  // HMR時に同一ポートでサーバーが立ち上がろうとする為、リロードが発生する前にサーバーを閉じる
  import.meta.hot.on("vite:beforeFullReload", () => {
    server.close();
  });
}
