import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";
import { updateTaskProgressController } from "./presentation/task/update-task-progress-controller";
import { addTeamMemberController } from "./presentation/team/add-team-member-controller";
import { changeTeamMemberStatusController } from "./presentation/team/change-team-member-status-controller";
import { createTeamController } from "./presentation/team/create-team-controller";
import { removeTeamMemberController } from "./presentation/team/remove-team-member-controller";

const app = new Hono();

app.route("/", updateTaskProgressController);
app.route("/", addTeamMemberController);
app.route("/", createTeamController);
app.route("/", removeTeamMemberController);
app.route("/", changeTeamMemberStatusController);

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
