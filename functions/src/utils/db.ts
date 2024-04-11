import {
  getFirestore,
  FirestoreDataConverter,
  CollectionReference,
  DocumentData,
  PartialWithFieldValue,
  FieldValue,
} from "firebase-admin/firestore";

import Level from "../types/Level";
import Waste from "../types/Waste";
import User from "../types/User";
import Bank from "../types/Bank";
import Seller from "../types/Seller";
import Product from "../types/Product";
import DeliverOrder from "../types/DeliverOrder";
import PickupOrder from "../types/PickupOrder";

/**
 * Firestore types converter.
 *
 * @return {FirestoreDataConverter} Firestore collection.
 */
const converter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: PartialWithFieldValue<T>) => data as DocumentData,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T,
});

/**
 * Generator for firestore collection.
 *
 * @param {string} path Collection path.
 * @return {CollectionReference<T>} Firestore collection.
 */
const getCollection = <T>(path: string): CollectionReference<T> =>
  getFirestore().collection(path).withConverter(converter<T>());

const db = {
  firestore: getFirestore(),
  users: getCollection<User>("users"),
  banks: getCollection<Bank>("banks"),
  sellers: getCollection<Seller>("seller"),
  levels: getCollection<Level>("levels"),
  products: getCollection<Product>("products"),
  wastes: getCollection<Waste>("wastes"),
  deliverOrders: getCollection<DeliverOrder>("deliverOrders"),
  pickupOrders: getCollection<PickupOrder>("pickupOrders"),
};

/**
 * Add user point, level up user if necessary.
 *
 * @param {string} uid User ID.
 * @param {number} points Points to be added.
 * @param {number} wastesCollected Wastes collected in number.
 * @return {Promise<void>}
 */
export async function monitorUserLevel(
  uid: string,
  points: number,
  wastesCollected: number
): Promise<void> {
  const userSnapshot = await db.users.doc(uid).get();
  const user = userSnapshot.data() as User;

  let levelId = user.levelId;

  const levelSnapshot = await db.levels.doc(levelId).get();
  const level = levelSnapshot.data() as Level;

  const updatedPoints = user.totalPoints + points;

  if (updatedPoints >= level.nextLevelPoint) {
    const trueLevelSnapshot = await db.levels
      .where("requiredPoint", "<=", updatedPoints)
      .where("nextLevelPoint", ">", updatedPoints)
      .limit(1)
      .get();

    const trueLevelId = trueLevelSnapshot.docs[0].id;

    levelId = trueLevelId;
  }

  // Add point to user
  await db.users.doc(uid).update({
    levelId,
    totalPoints: FieldValue.increment(points),
    wasteCollected: FieldValue.increment(wastesCollected),
  });
}

export default db;
