import Router = require("@koa/router");
import admin = require("firebase-admin");
import Joi = require("joi");

import { logger } from "firebase-functions/v1";
import db from "../utils/db";
import { UnauthorizedError } from "../types/Error";

import levelsData from "../data/levels";
import wastesData from "../data/wastes";
import usersMockupData from "../mockups/users";
import banksMockupData from "../mockups/banks";
import sellersMockupData from "../mockups/sellers";
import productsMockupData from "../mockups/products";
import pickupOrdersMockupData from "../mockups/pickups";

import { getRandomItem } from "../utils/random";
import Waste from "../types/Waste";

const router = new Router();
const initialized: string[] = [];

/**
 * Check if administrator account already exists.
 *
 * @return { Promise<boolean> }
 */
async function checkIsAdminExist(): Promise<boolean> {
  try {
    const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL);
    await admin.auth().getUserByEmail(ADMIN_EMAIL);

    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize administrator account.
 *
 * @return { Promise<void> }
 */
async function initializeAdmin(): Promise<void> {
  const isAdminExist = await checkIsAdminExist();

  if (!isAdminExist) {
    const ADMIN_EMAIL = String(process.env.DEFAULT_ADMIN_EMAIL);
    const ADMIN_PASSWORD = String(process.env.DEFAULT_ADMIN_PASSWORD);

    const { uid } = await admin.auth().createUser({
      displayName: "Administrator",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    admin.auth().setCustomUserClaims(uid, { role: "admin" });

    initialized.push("Auth.Administrator");
  }
}

/**
 * Data seeds for firestore.
 *
 * @return { Promise<void> }
 */
async function initializeFirestore(): Promise<void> {
  try {
    const batch = db.firestore.batch();

    const levels = await db.levels.get();
    const wastes = await db.wastes.get();

    if (levels.empty) {
      levelsData.forEach((document) => db.levels.add(document));
      initialized.push("Firestore.Levels");
    }

    if (wastes.empty) {
      wastesData.forEach((document) => db.wastes.add(document));
      initialized.push("Firestore.Wastes");
    }

    batch.commit();
  } catch (error) {
    logger.error("Failed initializing firestore: ", error);
    throw Error("Error in initializing firestore.");
  }
}

/**
 * Mockup data seeds for database.
 *
 * @return { Promise<void> }
 */
async function initializeMockups(): Promise<void> {
  try {
    const batch = db.firestore.batch();

    const banks = await db.banks.get();
    const users = await db.users.get();
    const sellers = await db.sellers.get();
    const products = await db.products.get();
    const pickups = await db.pickupOrders.get();

    const bankIds: string[] = [];
    const sellerIds: string[] = [];

    if (banks.empty) {
      for (const bank of banksMockupData) {
        const { uid } = await admin.auth().createUser({
          displayName: bank.name,
          email: bank.email,
          password: bank.password,
          phoneNumber: bank.phoneNumber,
          emailVerified: false,
          disabled: false,
        });

        bankIds.push(uid);
        admin.auth().setCustomUserClaims(uid, { role: bank.role });

        await db.banks.doc(uid).set({
          name: bank.name,
          address: bank.address,
          openSchedules: bank.openSchedules,
          closedDates: bank.closedDates,
          geoPoint: bank.geoPoint,
        });
      }

      initialized.push("Mockups.Auth.Banks");
      initialized.push("Mockups.Firestore.Banks");
    }

    if (users.empty) {
      for (const user of usersMockupData) {
        const { uid } = await admin.auth().createUser({
          displayName: user.name,
          email: user.email,
          password: user.password,
          phoneNumber: user.phoneNumber,
          emailVerified: false,
          disabled: false,
        });

        admin.auth().setCustomUserClaims(uid, { role: user.role });
        const levelId = await getLevelId(user.totalPoints);

        await db.users.doc(uid).set({
          address: user.address,
          gender: user.gender,
          totalPoints: user.totalPoints,
          wasteCollected: user.wasteCollected,
          levelId,
        });
      }

      initialized.push("Mockups.Auth.Users");
      initialized.push("Mockups.Firestore.Users");
    }

    if (sellers.empty) {
      for (const seller of sellersMockupData) {
        const { uid } = await admin.auth().createUser({
          displayName: seller.name,
          email: seller.email,
          password: seller.password,
          phoneNumber: seller.phoneNumber,
          emailVerified: false,
          disabled: false,
        });

        admin.auth().setCustomUserClaims(uid, { role: seller.role });

        sellerIds.push(uid);

        await db.sellers.doc(uid).set({
          name: seller.name,
          address: seller.address,
        });
      }

      initialized.push("Mockups.Auth.Sellers");
      initialized.push("Mockups.Firestore.Sellers");
    }

    if (products.empty) {
      for (const [index, product] of productsMockupData.entries()) {
        await db.products.add({
          name: product.name,
          description: product.description,
          price: product.price,
          marketplaces: product.marketplaces,
          ownerId: sellerIds[index],
          productImage: product.productImage,
        });
      }

      initialized.push("Mockups.Firestore.Products");
    }

    if (pickups.empty) {
      for (const pickupOrder of pickupOrdersMockupData) {
        const { phone } = pickupOrder.requester;
        const { uid } = await admin.auth().getUserByPhoneNumber(phone);

        const bankId = getRandomItem(bankIds);

        const wasteIds: string[] = [];
        const wastes = await db.wastes.listDocuments();
        wastes.forEach(({ id }) => wasteIds.push(id));

        const wasteId = getRandomItem(wasteIds);
        const wasteWeight = 3;
        let wastePoint = 0;

        const wasteDocument = await db.wastes.doc(wasteId).get();
        const waste = wasteDocument.data() as Waste;

        wastePoint = waste.point * wasteWeight;

        pickupOrder.userId = uid;
        pickupOrder.bankId = bankId;
        pickupOrder.wastes.push({ wasteId, wastePoint, wasteWeight });

        await db.pickupOrders.add(pickupOrder);
      }

      initialized.push("Mockups.Firestore.PickupOrders");
    }

    batch.commit();
  } catch (error) {
    logger.error("Failed initializing development environments: ", error);
    throw Error("Error in initializing development environment");
  }
}

/**
 * Get user level id.
 *
 * @param { number } point Points collected.
 * @return { Promise<string> }
 */
async function getLevelId(point: number): Promise<string> {
  let levelId = "";
  const snapshot = await db.levels
    .where("requiredPoint", "==", point)
    .limit(1)
    .get();
  snapshot.forEach(({ id }) => (levelId = id));

  return levelId;
}

router.post("/", async (ctx) => {
  const schema = Joi.object({
    INIT_KEY: Joi.string().required().error(new UnauthorizedError()),
    SEED_MOCKUPS: Joi.bool().default(false),
  });

  const { INIT_KEY: key, SEED_MOCKUPS } = await schema.validateAsync(
    ctx.request.body
  );
  const _key = process.env.INIT_KEY;

  if (key !== _key) throw new UnauthorizedError();

  await Promise.all([
    initializeAdmin(),
    initializeFirestore(),
    SEED_MOCKUPS ? initializeMockups() : Promise.resolve(null),
  ]);

  ctx.ok({ success: true, initialized });
});

export default router;
