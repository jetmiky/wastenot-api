import { Timestamp } from "firebase-admin/firestore";
import { PhoneNumberID } from "./Strings";

interface Sender {
  name: string;
  phone: PhoneNumberID;
}

interface Waste {
  wasteId: string;
  wasteWeight: number;
  wastePoint: number;
}

export type DeliverStatus =
  | "Belum diproses"
  | "Menunggu penimbangan"
  | "Selesai";

interface DeliverOrder {
  userId: string;
  bankId: string;
  sender: Sender;
  sendSchedule: Timestamp;
  wasteImageUrl: string;
  wastes: Waste[];
  status: DeliverStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default DeliverOrder;
