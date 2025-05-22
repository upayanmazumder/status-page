module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "./app",
      script: "npm",
      args: "start",
    },
    {
      name: "backend",
      cwd: "./api",
      script: "npm",
      args: "start",
    },
  ],
};
