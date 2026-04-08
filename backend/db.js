import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pay_at_table",
  password: "R8pt0r5792",
  port: 5433,
});