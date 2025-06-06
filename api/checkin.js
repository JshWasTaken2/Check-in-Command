import admin from "firebase-admin";

// Initialize Firebase only once (Vercel-compatible)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Convert number to ordinal string (1st, 2nd, 3rd, etc.)
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default async function handler(req, res) {
  try {
    const user = req.query.user;
    if (!user) {
      return res.status(400).send("Missing 'user' query parameter.");
    }

    const userId = user.toLowerCase();
    const docRef = db.collection("checkins").doc(userId);
    const docSnap = await docRef.get();

    let count = 0;
    let response = "";

    if (docSnap.exists) {
      count = docSnap.data().count + 1;
      await docRef.update({ count });
      const ordinal = getOrdinal(count);
      response = `@${user} has just checked in for the ${ordinal} time. You got this!`;
    } else {
      count = 1;
      await docRef.set({ count });
      response = `@${user} has checked in for the first time. You got this!`;
    }

    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(response);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error.");
  }
}
