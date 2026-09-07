import { defineConfig } from "orval";

export default defineConfig({
  backend: {
    output: {
      mode: "tags-split",
      target: "app/gen/backend.ts",
      schemas: "app/gen/schema",
      clean: true,
      client: "react-query",
      override: {
        mutator: {
          path: "app/api/mutator/ky.ts",
          name: "kyInstance",
        },
        query: {
          usePrefetch: true,
          useSuspenseQuery: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write app/gen/**/*",
    },
    input: {
      target: "../backend/openapi.json",
    },
  },
});
