import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";
import { getTasksByOwnerIdController } from "./presentation/task/get-tasks-by-owner-id-controller";
import { updateTaskProgressController } from "./presentation/task/update-task-progress-controller";
import { addTeamMemberController } from "./presentation/team/add-team-member-controller";
import { changeTeamMemberStatusController } from "./presentation/team/change-team-member-status-controller";
import { createTeamController } from "./presentation/team/create-team-controller";
import { getTeamByNameController } from "./presentation/team/get-team-by-name-controller";
import { getTeamController } from "./presentation/team/get-team-controller";
import { removeTeamMemberController } from "./presentation/team/remove-team-member-controller";

const app = new Hono();

app.route("/", addTeamMemberController);
app.route("/", changeTeamMemberStatusController);
app.route("/", createTeamController);
app.route("/", getTeamController);
app.route("/", getTeamByNameController);
app.route("/", getTasksByOwnerIdController);
app.route("/", removeTeamMemberController);
app.route("/", updateTaskProgressController);

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
