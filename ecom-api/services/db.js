import Datastore from 'nedb-promises';

export const usersDb = Datastore.create({ filename: 'ecom-api/users.db', autoload: true });
export const productsDb = Datastore.create({ filename: 'ecom-api/products.db', autoload: true });
export const cartsDb = Datastore.create({ filename: 'ecom-api/carts.db', autoload: true });
export const ordersDb = Datastore.create({ filename: 'ecom-api/orders.db', autoload: true });

await usersDb.ensureIndex({ fieldName: 'id', unique: true });
await usersDb.ensureIndex({ fieldName: 'email', unique: true });
await productsDb.ensureIndex({ fieldName: 'id', unique: true });
await productsDb.ensureIndex({ fieldName: 'title' });
await cartsDb.ensureIndex({ fieldName: 'userId', unique: true });
await ordersDb.ensureIndex({ fieldName: 'id', unique: true });

export async function getNextId(db) {
  const last = await db.findOne({}).sort({ id: -1 });
  return last ? last.id + 1 : 1;
}


