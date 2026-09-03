// Dev user configuration for seeding — can be imported from Node.js scripts
export const DEV_USERS = [
  {
    email: "dev@example.com",
    password: "devpassword123",
    name: "Dev User",
    role: "user" as const,
    affiliation: "กรมยุทธการทหาร",
  },
  {
    email: "admin@example.com",
    password: "adminpassword123",
    name: "Admin User",
    role: "admin" as const,
    affiliation: "กองบัญชาการกองทัพไทย",
  },
];
