import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { emptyWorkspace } from "../src/lib/workspace/schema";
test(
  "PostgreSQL persists workspace across connections and rejects stale writes",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    const first = new PrismaClient({ datasourceUrl: url });
    const second = new PrismaClient({ datasourceUrl: url });
    const id = "integration-" + crypto.randomUUID();
    try {
      const state = emptyWorkspace();
      state.projects.push({
        id: "project",
        name: "Integration fixture",
        question: "Does data persist?",
        criteria: "Synthetic test only",
        createdAt: new Date().toISOString(),
        members: [],
      });
      await first.researchWorkspace.create({
        data: { id, data: JSON.stringify(state) },
      });
      await first.$disconnect();
      const row = await second.researchWorkspace.findUniqueOrThrow({
        where: { id },
      });
      assert.equal(
        JSON.parse(row.data).projects[0].name,
        "Integration fixture",
      );
      const writes = await Promise.all(
        [0, 1].map((i) =>
          second.researchWorkspace.updateMany({
            where: { id, revision: 0 },
            data: {
              revision: { increment: 1 },
              data: JSON.stringify({ ...state, compare: [String(i)] }),
            },
          }),
        ),
      );
      assert.deepEqual(writes.map((w) => w.count).sort(), [0, 1]);
      assert.equal(
        (await second.researchWorkspace.findUniqueOrThrow({ where: { id } }))
          .revision,
        1,
      );
    } finally {
      await second.researchWorkspace.deleteMany({ where: { id } });
      await first.$disconnect();
      await second.$disconnect();
    }
  },
);
