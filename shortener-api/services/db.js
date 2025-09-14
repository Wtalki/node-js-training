import Datastore from 'nedb-promises';

export const linksDb = Datastore.create({ filename: 'shortener-api/links.db', autoload: true });
await linksDb.ensureIndex({ fieldName: 'id', unique: true });
await linksDb.ensureIndex({ fieldName: 'shortCode', unique: true });

export async function getNextId() {
  const last = await linksDb.findOne({}).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}


