import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert("./firebase/serviceAccountKey.json"),
  });
}

const db = getFirestore();

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default async function handler(req, res) {
  const user = req.query.user;

  if (!user) {
    return res.status(400).send("Missing ?user=username parameter.");
  }

  const docRef = db.collection("checkins").doc(user.toLowerCase());
  const doc = await docRef.get();

  let count = 0;

  if (doc.exists) {
    count = doc.data().count + 1;
    await docRef.update({ count });
    const ordinal = getOrdinal(count);
    return res.send(`@${user} has just checked in for the ${ordinal} time.`);
  } else {
    count = 1;
    await docRef.set({ count });
    return res.send(`@${user} has checked in for the first time. Welcome!`);
  }
}
