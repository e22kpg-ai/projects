import { config } from "dotenv";
config({ path: ".env.local" });

// Dynamic imports so dotenv finishes loading .env.local before ./client reads
// process.env at module-evaluation time (static imports are hoisted and would
// run before the config() call above).
async function main() {
  const { db } = await import("./client");
  const { rooms } = await import("./schema/app-schema");

  const sampleRooms = [
    { name: "Ocean Room", location: "ชั้น 3", capacity: 8 },
    { name: "Sky Room", location: "ชั้น 5", capacity: 4 },
    { name: "Garden Room", location: "ชั้น 1", capacity: 12 },
    { name: "Focus Pod", location: "ชั้น 2", capacity: 2 },
  ];

  await db.insert(rooms).values(sampleRooms).onConflictDoNothing();
  console.log(`Seeded ${sampleRooms.length} rooms.`);

  const { auth } = await import("../better-auth/auth");
  const { DEV_USER_EMAIL, DEV_USER_PASSWORD, DEV_USER_NAME } = await import(
    "../better-auth/dev-user"
  );
  try {
    await auth.api.signUpEmail({
      body: { email: DEV_USER_EMAIL, password: DEV_USER_PASSWORD, name: DEV_USER_NAME },
    });
    console.log(`Seeded dev user: ${DEV_USER_EMAIL}`);
  } catch {
    console.log("Dev user already exists, skipping.");
  }
}

main();
