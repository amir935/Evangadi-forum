import fs from "node:fs/promises";
import path from "node:path";
import { db } from './config.js'
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url))
const ensureSchema = async () => {
    // read sql file
    const sql = await fs.readFile(path.join(here, 'schema.sql'), 'utf8');
    //spliting sql statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !/^(CREATE DATABASE|USE)\b/i.test(s));
    for (const statement of statements) {
        await db.query(statement);
    }
};
// process.argv[1] is the absolute path of the file Node was started with.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    ensureSchema()
        .then(() => {
            console.log('Schema is up to date.');
            process.exit(0);
        })
        .then(err => {
            console.error('Schema migration failed:', err.message);
            process.exit(1);
        })
}

export default ensureSchema;