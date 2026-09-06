import { railway } from "@railway/railway";

export default railway({
  services: {
    "insurtech-api": {
      build: {
        builder: "DOCKERFILE",
        dockerfilePath: "backend/Dockerfile",
      },
      deploy: {
        startCommand: "java -jar app.jar",
        healthcheckPath: "/api/v1/health",
        healthcheckTimeout: 30,
        restartPolicyType: "ON_FAILURE",
        restartPolicyMaxRetries: 10,
      },
    },
    "insurtech-web": {
      build: {
        builder: "DOCKERFILE",
        dockerfilePath: "frontend/Dockerfile",
      },
      deploy: {
        startCommand:
          "/bin/sh -c \": ${PORT:=80} && export PORT && envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'\"",
        healthcheckPath: "/",
        healthcheckTimeout: 30,
        restartPolicyType: "ON_FAILURE",
        restartPolicyMaxRetries: 10,
      },
    },
  },
});
