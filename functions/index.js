// ===========================
// ייבוא חבילות נדרשות
// ===========================
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ===========================
// אתחול Firebase Admin SDK
// אין צורך ב-dotenv — Firebase מנהל את משתני הסביבה בעצמו
// ===========================
admin.initializeApp();

// ===========================
// הפניות לאוספי Firestore
// ===========================
const db = admin.firestore();
const managersCol = db.collection('managers');   // אוסף מנהלות
const employeesCol = db.collection('employees'); // אוסף עובדות
const shiftsCol = db.collection('shifts');       // אוסף משמרות

// ===========================
// קריאת JWT_SECRET ממשתני סביבה של Firebase
// הגדרה: firebase functions:config:set app.jwt_secret="..."
// ===========================
const JWT_SECRET = process.env.JWT_SECRET || 'leader_app_super_secret_key_2026';
if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET חסר בהגדרות Firebase!');
}

const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.json());

// ===========================
// Middleware לאימות Token
// זהה לגמרי לגרסה המקורית — JWT לא השתנה
// ===========================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'אין Token' });
    }

    jwt.verify(token, JWT_SECRET, (err, manager) => {
        if (err) {
            return res.status(403).json({ message: 'Token לא תקין' });
        }
        req.manager = manager;
        next();
    });
};

// ===========================
// בדיקה שהשרת רץ
// ===========================
app.get('/', (req, res) => {
    res.send('Server is running with Firebase Firestore! 🚀');
});

// ===========================
// MANAGERS (מנהלות)
// ===========================

// רישום מנהלת חדשה
// במקום INSERT INTO managers → הוספת מסמך לאוסף managers
app.post('/register', async (req, res) => {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
        return res.status(400).json({ message: 'חסרים פרטים' });
    }

    if (!/^0\d{9}$/.test(phone)) {
        return res.status(400).json({ message: 'מספר טלפון לא תקין (צריך 10 ספרות)' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    try {
        // בדיקה אם האימייל כבר קיים — Firestore אינו מאכף UNIQUE, לכן בודקים ידנית
        const existing = await managersCol.where('email', '==', email).limit(1).get();
        if (!existing.empty) {
            return res.status(500).json({ message: 'מנהלת כבר קיימת או שגיאה במסד' });
        }

        // הוספת מסמך חדש — Firestore מייצר ID אלפאנומרי אוטומטי
        const docRef = await managersCol.add({
            first_name: firstName,
            last_name: lastName,
            phone,
            email,
            password, // הערה: בפרודקשן כדאי להצפין סיסמאות עם bcrypt
        });

        res.status(201).json({
            id: docRef.id, // מחזירים את ה-ID שנוצר אוטומטית על ידי Firestore
            message: 'נרשמת בהצלחה',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'מנהלת כבר קיימת או שגיאה במסד' });
    }
});

// התחברות מנהלת קיימת
// במקום SELECT * FROM managers WHERE email = $1 AND password = $2
// → שאילתת Firestore עם where על שדות email ו-password
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'אנא מלא אימייל וסיסמה' });
    }

    try {
        // חיפוש מנהלת לפי אימייל וסיסמה
        const snapshot = await managersCol
            .where('email', '==', email)
            .where('password', '==', password)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ message: 'האימייל או הסיסמה לא תואמים' });
        }

        // שליפת המסמך הראשון שנמצא
        const doc = snapshot.docs[0];
        const manager = { id: doc.id, ...doc.data() };

        // יצירת JWT — זהה לגמרי לגרסה המקורית
        const token = jwt.sign(
            { id: manager.id, email: manager.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            manager: {
                id: manager.id,
                firstName: manager.first_name,
                lastName: manager.last_name,
                email: manager.email,
                phone: manager.phone,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה במסד' });
    }
});

// קבלת פרטי המנהלת המחוברת
// במקום SELECT * FROM managers WHERE id = $1 → doc().get() לפי מזהה המסמך
app.get('/manager/profile', authenticateToken, async (req, res) => {
    const managerId = req.manager.id;

    try {
        const doc = await managersCol.doc(managerId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'מנהלת לא נמצאה' });
        }

        const manager = doc.data();
        res.json({
            id: doc.id,
            firstName: manager.first_name,
            lastName: manager.last_name,
            email: manager.email,
            phone: manager.phone,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה במסד' });
    }
});

// עדכון פרטי המנהלת
// במקום UPDATE managers SET ... WHERE id = $5 → doc().update()
app.put('/manager/profile', authenticateToken, async (req, res) => {
    const managerId = req.manager.id;
    const { firstName, lastName, phone, email } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'שם ואימייל חובה' });
    }

    if (phone && !/^0\d{9}$/.test(phone)) {
        return res.status(400).json({ message: 'מספר טלפון לא תקין' });
    }

    try {
        // עדכון שדות ספציפיים במסמך הקיים — update() לא מוחק שדות אחרים
        await managersCol.doc(managerId).update({
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            email,
        });

        res.json({ message: 'הפרטים עודכנו בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בעדכון הפרטים' });
    }
});

// שינוי סיסמה
// קריאת מסמך המנהלת ואז עדכון שדה הסיסמה בלבד
app.put('/manager/password', authenticateToken, async (req, res) => {
    const managerId = req.manager.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'יש למלא את שתי הסיסמאות' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' });
    }

    try {
        const doc = await managersCol.doc(managerId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'מנהלת לא נמצאה' });
        }

        const manager = doc.data();

        // השוואת הסיסמה הנוכחית
        if (manager.password !== currentPassword) {
            return res.status(401).json({ message: 'הסיסמה הנוכחית שגויה' });
        }

        // עדכון שדה הסיסמה בלבד
        await managersCol.doc(managerId).update({ password: newPassword });

        res.json({ message: 'הסיסמה שונתה בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בעדכון הסיסמה' });
    }
});

// ===========================
// EMPLOYEES (עובדות)
// ===========================

// הוספת עובדת חדשה
// במקום INSERT INTO employees → הוספת מסמך לאוסף employees
app.post('/employees', authenticateToken, async (req, res) => {
    const { firstName, lastName, phone } = req.body;
    const managerId = req.manager.id;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'שם פרטי ושם משפחה חובה' });
    }

    if (phone && !/^0\d{9}$/.test(phone)) {
        return res.status(400).json({ message: 'מספר טלפון לא תקין' });
    }

    try {
        // Firestore מייצר ID מחרוזת אלפאנומרית אוטומטית
        const docRef = await employeesCol.add({
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            manager_id: managerId, // שמירת מזהה המנהלת כדי לקשר בין הרשומות
        });

        res.status(201).json({
            id: docRef.id,
            message: 'העובדת נוספה בהצלחה',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה במסד בעת הוספת עובדת' });
    }
});

// קבלת כל העובדות של המנהלת המחוברת
// במקום SELECT * FROM employees WHERE manager_id = $1 → where query
app.get('/employees', authenticateToken, async (req, res) => {
    const managerId = req.manager.id;

    try {
        const snapshot = await employeesCol
            .where('manager_id', '==', managerId)
            .get();

        // המרת מסמכי Firestore למבנה JSON שמחזיר גם את ה-id
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בשליפת נתוני עובדות' });
    }
});

// עדכון עובדת
// בדיקה שהעובדת שייכת למנהלת, ואז עדכון שדות
app.put('/employees/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone } = req.body;
    const managerId = req.manager.id;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'שם פרטי ושם משפחה חובה' });
    }

    if (phone && !/^0\d{9}$/.test(phone)) {
        return res.status(400).json({ message: 'מספר טלפון לא תקין' });
    }

    try {
        // שליפת המסמך לבדיקת בעלות — מנגנון ה-WHERE id AND manager_id
        const doc = await employeesCol.doc(id).get();

        if (!doc.exists || doc.data().manager_id !== managerId) {
            return res.status(403).json({ message: 'אין הרשאה לעדכן עובדת זו' });
        }

        await employeesCol.doc(id).update({
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
        });

        res.json({ message: 'העובדת עודכנה בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בעדכון העובדת' });
    }
});

// מחיקת עובדת
// בדיקת בעלות ואז מחיקת המסמך מ-Firestore
app.delete('/employees/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const managerId = req.manager.id;

    try {
        const doc = await employeesCol.doc(id).get();

        if (!doc.exists || doc.data().manager_id !== managerId) {
            return res.status(403).json({ message: 'אין הרשאה למחוק עובדת זו' });
        }

        // מחיקת המסמך לפי ה-id שלו
        await employeesCol.doc(id).delete();

        res.json({ message: 'העובדת נמחקה בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה במחיקת העובדת' });
    }
});

// ===========================
// SHIFTS (משמרות)
// ===========================

// שמירת משמרת
// שינוי מפתח: ב-PostgreSQL ID היה מספר שלם (parseInt).
// ב-Firestore, ה-ID הוא מחרוזת אלפאנומרית (למשל "m_abc123" או "e_xyz789").
// הלוגיקה פירקה "m_1" ל-["m","1"] ועשתה parseInt — עכשיו פשוט לוקחים את המחרוזת כמות שהיא.
app.post('/shifts', authenticateToken, async (req, res) => {
    const { employeeId, day, shiftType, weekStartDate } = req.body;
    const managerId = req.manager.id;

    if (!employeeId || !day || !shiftType || !weekStartDate) {
        return res.status(400).json({ message: 'חסרים פרטים' });
    }

    try {
        // פירוק ה-prefix: "m_abc123" → prefix="m", realId="abc123"
        // שינוי מהגרסה המקורית: לא קוראים parseInt, ה-ID נשאר מחרוזת
        const underscoreIndex = employeeId.indexOf('_');

        if (underscoreIndex === -1) {
            return res.status(400).json({ message: 'פורמט ID לא תקין' });
        }

        const type = employeeId.substring(0, underscoreIndex);       // "m" או "e"
        const realId = employeeId.substring(underscoreIndex + 1);    // מחרוזת ה-ID של Firestore

        if (type === 'm') {
            // זו מנהלת — בדוק שה-ID תואם למנהלת המחוברת
            if (realId !== managerId) {
                return res.status(403).json({ message: 'אין הרשאה לשבץ מנהלת אחרת' });
            }
            // תקין — ממשיכים לשמירה
        } else if (type === 'e') {
            // זו עובדת — שליפת המסמך לבדיקת בעלות
            const employeeDoc = await employeesCol.doc(realId).get();

            if (!employeeDoc.exists || employeeDoc.data().manager_id !== managerId) {
                return res.status(400).json({ message: 'עובדת לא נמצאה או אינה שייכת לך' });
            }
        } else {
            return res.status(400).json({ message: 'סוג ID לא מזוהה' });
        }

        // שמירת המשמרת עם ה-prefix המלא (כמו בגרסה המקורית)
        const docRef = await shiftsCol.add({
            manager_id: managerId,
            employee_id: employeeId, // שומרים את המחרוזת המלאה כולל prefix, למשל "e_abc123"
            day,
            shift_type: shiftType,
            week_start_date: weekStartDate,
        });

        res.status(201).json({
            id: docRef.id,
            message: 'המשמרת נשמרה',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בשמירת המשמרת' });
    }
});

// קבלת משמרות לשבוע מסוים
// במקום SELECT * FROM shifts WHERE manager_id AND week_start_date
// → שאילתת where כפולה על Firestore
app.get('/shifts/:weekStart', authenticateToken, async (req, res) => {
    const { weekStart } = req.params;
    const managerId = req.manager.id;

    try {
        const snapshot = await shiftsCol
            .where('manager_id', '==', managerId)
            .where('week_start_date', '==', weekStart)
            .get();

        const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(shifts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בשליפת משמרות' });
    }
});

// מחיקת משמרות ליום ומשמרת ספציפיים
// ב-SQL — DELETE WHERE עם 4 תנאים. ב-Firestore — חיפוש המסמכים ואז מחיקה אחת-אחת (batch)
app.delete('/shifts/:weekStart/:day/:shiftType', authenticateToken, async (req, res) => {
    const { weekStart, day, shiftType } = req.params;
    const managerId = req.manager.id;

    try {
        // שאילתה על כל המשמרות שעומדות בתנאים
        const snapshot = await shiftsCol
            .where('manager_id', '==', managerId)
            .where('week_start_date', '==', weekStart)
            .where('day', '==', day)
            .where('shift_type', '==', shiftType)
            .get();

        // שימוש ב-batch לביצוע מחיקות מרובות בפעולה אטומית אחת
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.json({ message: 'משמרות נמחקו' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה במחיקת משמרות' });
    }
});

// מחיקת כל המשמרות של שבוע (לאיפוס)
// אותו עיקרון: שאילתה + batch delete
app.delete('/shifts/:weekStart', authenticateToken, async (req, res) => {
    const { weekStart } = req.params;
    const managerId = req.manager.id;

    try {
        const snapshot = await shiftsCol
            .where('manager_id', '==', managerId)
            .where('week_start_date', '==', weekStart)
            .get();

        // מחיקה אטומית של כל המשמרות של השבוע
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        res.json({ message: 'השבוע אופס בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה באיפוס השבוע' });
    }
});

// ===========================
// ייצוא האפליקציה כ-Cloud Function
// במקום app.listen() — Firebase מטפל בשרת עצמו
// ===========================
exports.api = functions.https.onRequest(app);