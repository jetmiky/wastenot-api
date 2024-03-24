import Router = require("@koa/router");
import admin = require("firebase-admin");
import Joi = require("joi");

import { logger } from "firebase-functions/v1";
import { GeoPoint } from "firebase-admin/firestore";
import db from "../utils/db";
import { UnauthorizedError } from "../types/Error";

import levelsData from "../data/levels";
import wastesData from "../data/wastes";

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
 * Data seeds for development environment.
 *
 * @return { Promise<void> }
 */
async function initializeDevelopment(): Promise<void> {
  try {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      const batch = db.firestore.batch();

      const banks = await db.banks.get();
      const products = await db.products.get();
      const users = await db.users.get();

      let bankUid = "";

      if (banks.empty) {
        const DEFAULT_BANK_NAME = "Default Bank";
        const DEFAULT_BANK_EMAIL = "bank@wastenot.id";
        const DEFAULT_BANK_PASSWORD = "password";
        const DEFAULT_BANK_PHONE_NUMBER = "+6212345678901";
        const DEFAULT_BANK_ADDRESS = "Jakarta";
        const DEFAULT_LATITUDE = 1;
        const DEFAULT_LONGITUDE = 2;

        const { uid } = await admin.auth().createUser({
          displayName: DEFAULT_BANK_NAME,
          email: DEFAULT_BANK_EMAIL,
          password: DEFAULT_BANK_PASSWORD,
          phoneNumber: DEFAULT_BANK_PHONE_NUMBER,
          emailVerified: false,
          disabled: false,
        });

        bankUid = uid;
        admin.auth().setCustomUserClaims(uid, { role: "bank" });

        initialized.push("Development.Auth.Banks");

        await db.banks.doc(uid).set({
          name: DEFAULT_BANK_NAME,
          address: DEFAULT_BANK_ADDRESS,
          openSchedules: [
            {
              dayOfWeek: "1",
              scheduleTimeOpen: "08:00",
              scheduleTimeClose: "17:00",
            },
            {
              dayOfWeek: "2",
              scheduleTimeOpen: "09:00",
              scheduleTimeClose: "16:00",
            },
            {
              dayOfWeek: "3",
              scheduleTimeOpen: "10:00",
              scheduleTimeClose: "15:00",
            },
          ],
          closedDates: ["2023-01-01", "2023-01-02"],
          geoPoint: new GeoPoint(DEFAULT_LATITUDE, DEFAULT_LONGITUDE),
        });

        initialized.push("Development.Firestore.Banks");
      }

      if (products.empty) {
        const DEFAULT_PRODUCT_NAME = "A Default Product";
        const DEFAULT_PRODUCT_DESC = "Lorem impsum dolor sit amet.";
        const DEFAULT_PRODUCT_PRICE = 10000;
        const DEFAULT_PRODUCT_STORE_NAME = "Tokopedia";
        const DEFAULT_PRODUCT_STORE_URL = "https://www.google.com";

        await db.products.add({
          name: DEFAULT_PRODUCT_NAME,
          description: DEFAULT_PRODUCT_DESC,
          price: DEFAULT_PRODUCT_PRICE,
          ownerId: bankUid,
          marketplaces: [
            {
              name: DEFAULT_PRODUCT_STORE_NAME,
              url: DEFAULT_PRODUCT_STORE_URL,
            },
          ],
        });

        initialized.push("Development.Firestore.Products");
      }

      if (users.empty) {
        const DEFAULT_USER_NAME = "Default User";
        const DEFAULT_USER_EMAIL = "user@wastenot.id";
        const DEFAULT_USER_PASSWORD = "password";
        const DEFAULT_USER_PHONE_NUMBER = "+621234567890";
        const DEFAULT_USER_ADDRESS = "Jakarta";
        const DEFAULT_USER_GENDER = "Laki Laki";

        const { uid } = await admin.auth().createUser({
          displayName: DEFAULT_USER_NAME,
          email: DEFAULT_USER_EMAIL,
          password: DEFAULT_USER_PASSWORD,
          phoneNumber: DEFAULT_USER_PHONE_NUMBER,
          emailVerified: false,
          disabled: false,
        });

        admin.auth().setCustomUserClaims(uid, { role: "user" });

        initialized.push("Development.Auth.Users");

        let levelId = "";

        const levelDocs = await db.levels
          .where("name", "==", "Epic")
          .limit(1)
          .get();
        levelDocs.forEach((docs) => (levelId = docs.id));

        await db.users.doc(uid).set({
          address: DEFAULT_USER_ADDRESS,
          gender: DEFAULT_USER_GENDER,
          levelId: levelId,
          totalPoints: 22,
          wasteCollected: 10,
        });

        initialized.push("Development.Firestore.Users");
      }

      batch.commit();
    }
  } catch (error) {
    logger.error("Failed initializing development environments: ", error);
    throw Error("Error in initializing development environment");
  }
}

router.post("/", async (ctx) => {
  const schema = Joi.object({
    INIT_KEY: Joi.string().required().error(new UnauthorizedError()),
  });

  const { INIT_KEY: key } = await schema.validateAsync(ctx.request.body);
  const _key = process.env.INIT_KEY;

  if (key !== _key) throw new UnauthorizedError();

  await Promise.all([
    initializeAdmin(),
    initializeFirestore(),
    initializeDevelopment(),
  ]);

  ctx.ok({ success: true, initialized });
});

export default router;
