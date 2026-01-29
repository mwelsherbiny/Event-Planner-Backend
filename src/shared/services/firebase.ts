import admin from "firebase-admin";
import serviceAccount from "../../../serviceAccountKey.json" with { type: "json" };
import type { ServiceAccount } from "firebase-admin";

const certObject = serviceAccount as ServiceAccount;
const firebase = admin.initializeApp({
  credential: admin.credential.cert(certObject),
});

export default firebase;
