import { GeoPoint, Timestamp } from "firebase-admin/firestore";

interface Requester {
  name: string;
  phone: string;
  address: string;
  pickupSchedule: Timestamp;
  geoPoint: GeoPoint;
}

interface Waste {
  wasteId: string;
  wasteWeight: number;
  wastePoint: number;
}

interface PickupOrder {
  userId: string;
  bankId: string;
  requester: Requester;
  realizedPickupTime: Timestamp;
  wasteImageUrl: string;
  wastes: Waste[];
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default PickupOrder;
