import {
  getFirestore,
  FirestoreDataConverter,
  CollectionReference,
  DocumentData,
  PartialWithFieldValue,
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

export default db;
