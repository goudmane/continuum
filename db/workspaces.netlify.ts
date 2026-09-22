import { emptyWorkspace, type Workspace } from "@/lib/domain/workspace";

export async function readWorkspace() {
  return { revision: 0, workspace: emptyWorkspace() };
}

export async function saveWorkspace(
  _userId: string,
  _revision: number,
  _workspace: Workspace,
) {
  void _userId;
  void _revision;
  void _workspace;
  return false;
}
