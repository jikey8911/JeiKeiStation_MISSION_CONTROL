
// In-memory mock database for environments without MySQL
let agentsArr: any[] = [
  { id: 1, name: "Agente Alfa", description: "Especialista en Backend", skills: JSON.stringify(["Node.js", "TypeScript", "SQL"]), status: "available", currentWorkload: 0, maxCapacity: 10, createdAt: new Date() },
  { id: 2, name: "Agente Beta", description: "Experto en Frontend", skills: JSON.stringify(["React", "CSS", "Tailwind"]), status: "available", currentWorkload: 0, maxCapacity: 10, createdAt: new Date() }
];
let sprintsArr: any[] = [];
let tasksArr: any[] = [];
let taskDependenciesArr: any[] = [];
let taskHistoryArr: any[] = [];
let notificationsArr: any[] = [];
let usersArr: any[] = [];

let nextIds = {
  users: 1,
  agents: 3,
  sprints: 1,
  tasks: 1,
  notifications: 1
};

export const mockDb = {
  users: {
    find: (openId: string) => usersArr.find(u => u.openId === openId),
    upsert: (user: any) => {
      const existing = usersArr.find(u => u.openId === user.openId);
      if (existing) Object.assign(existing, user);
      else usersArr.push({ ...user, id: nextIds.users++ });
    }
  },
  agents: {
    list: () => agentsArr,
    get: (id: number) => agentsArr.find(a => a.id === id),
    create: (data: any) => {
      const agent = { ...data, id: nextIds.agents++, status: "available", currentWorkload: 0, createdAt: new Date(), skills: JSON.stringify(data.skills) };
      agentsArr.push(agent);
      return { lastInsertId: agent.id };
    },
    updateWorkload: (id: number, workload: number) => {
      const a = agentsArr.find(a => a.id === id);
      if (a) a.currentWorkload = workload;
    }
  },
  sprints: {
    list: () => [...sprintsArr].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    get: (id: number) => sprintsArr.find(s => s.id === id),
    create: (data: any) => {
      const sprint = { ...data, id: nextIds.sprints++, status: "planning", createdAt: new Date() };
      sprintsArr.push(sprint);
      return { lastInsertId: sprint.id };
    },
    updateStatus: (id: number, status: string) => {
      const s = sprintsArr.find(s => s.id === id);
      if (s) s.status = status;
    }
  },
  tasks: {
    list: (sprintId?: number) => {
      let r = tasksArr;
      if (sprintId) r = r.filter(t => t.sprintId === sprintId);
      return r.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    get: (id: number) => tasksArr.find(t => t.id === id),
    create: (data: any) => {
      const task = {
        ...data,
        id: nextIds.tasks++,
        status: "backlog",
        createdAt: new Date(),
        requiredSkills: data.requiredSkills || [],
        acceptanceCriteria: data.acceptanceCriteria || []
      };
      tasksArr.push(task);
      return { lastInsertId: task.id };
    },
    updateStatus: (id: number, status: string) => {
      const t = tasksArr.find(t => t.id === id);
      if (t) {
        t.status = status;
        t.completedAt = status === "done" ? new Date() : null;
      }
    },
    assign: (id: number, agentId: number) => {
      const t = tasksArr.find(t => t.id === id);
      if (t) t.assignedAgentId = agentId;
    }
  },
  dependencies: {
    list: (taskId?: number) => taskId ? taskDependenciesArr.filter(d => d.taskId === taskId) : taskDependenciesArr,
    create: (taskId: number, dependsOnTaskId: number) => {
      const d = { taskId, dependsOnTaskId };
      taskDependenciesArr.push(d);
      return d;
    },
    delete: (taskId: number, dependsOnTaskId: number) => {
      taskDependenciesArr = taskDependenciesArr.filter(d => !(d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId));
    }
  },
  notifications: {
    list: (userId: number) => notificationsArr.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    create: (data: any) => {
      const n = { ...data, id: nextIds.notifications++, read: false, archived: false, createdAt: new Date() };
      notificationsArr.push(n);
      return n;
    },
    markRead: (id: number) => {
      const n = notificationsArr.find(n => n.id === id);
      if (n) n.read = true;
      return n;
    },
    markAllRead: (ids: number[]) => {
      const updated = notificationsArr.filter(n => ids.includes(n.id));
      updated.forEach(n => n.read = true);
      return updated.length > 0 ? updated : undefined;
    },
    archive: (id: number) => {
      const n = notificationsArr.find(n => n.id === id);
      if (n) n.archived = true;
      return n;
    },
    archiveAll: (ids: number[]) => {
      const updated = notificationsArr.filter(n => ids.includes(n.id));
      updated.forEach(n => n.archived = true);
      return updated.length > 0 ? updated : undefined;
    }
  }
};
