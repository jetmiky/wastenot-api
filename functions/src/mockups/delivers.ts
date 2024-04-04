import DeliverOrder from "../types/DeliverOrder";
import { PhoneNumberID } from "../types/Strings";
import { Timestamp } from "firebase-admin/firestore";
import { timestampFromISODateString } from "../utils/formats";

const convertDateToTimestamp = (date: string): Timestamp => {
  return timestampFromISODateString(new Date(date).toISOString());
};

const timestamp1 = convertDateToTimestamp("2024-03-07");
const timestamp2 = convertDateToTimestamp("2024-03-10");
const timestamp3 = convertDateToTimestamp("2024-03-13");
const timestamp4 = convertDateToTimestamp("2024-03-16");
const timestamp5 = convertDateToTimestamp("2024-03-19");

const deliverOrders: DeliverOrder[] = [
  {
    userId: "",
    bankId: "",
    wasteImagePath: "mockups/waste1.jpg",
    wastes: [],
    sender: {
      name: "John Doe",
      phone: "+621234567810" as PhoneNumberID,
    },
    sendSchedule: timestamp2,
    status: "Selesai",
    createdAt: timestamp1,
    updatedAt: timestamp3,
  },
  {
    userId: "",
    bankId: "",
    wasteImagePath: "mockups/waste2.jpg",
    wastes: [],
    sender: {
      name: "John Doe",
      phone: "+621234567810" as PhoneNumberID,
    },
    sendSchedule: timestamp4,
    status: "Belum diproses",
    createdAt: timestamp3,
    updatedAt: timestamp3,
  },
  {
    userId: "",
    bankId: "",
    wasteImagePath: "mockups/waste1.jpg",
    wastes: [],
    sender: {
      name: "Annie Tate",
      phone: "+621234567811" as PhoneNumberID,
    },
    sendSchedule: timestamp4,
    status: "Belum diproses",
    createdAt: timestamp3,
    updatedAt: timestamp3,
  },
  {
    userId: "",
    bankId: "",
    wasteImagePath: "mockups/waste2.jpg",
    wastes: [],
    sender: {
      name: "Annie Tate",
      phone: "+621234567811" as PhoneNumberID,
    },
    sendSchedule: timestamp5,
    status: "Menunggu penimbangan",
    createdAt: timestamp4,
    updatedAt: timestamp5,
  },
];

export default deliverOrders;
