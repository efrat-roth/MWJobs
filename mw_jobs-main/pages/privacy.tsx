import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
        <Head>
            <title>מדיניות פרטיות - MW Jobs</title>
            <meta name="description" content="מדיניות פרטיות למערכת ניהול עובדים לאירועים" />
        </Head>
        <div className="landing-container">
        <div className="content-page">
            <h1 className="content-page-title">מדיניות פרטיות</h1>
            
            <p className="content-page-last-updated">
            <strong>עדכון אחרון:</strong> {new Date().toLocaleDateString('he-IL')}
            </p>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">1. כללי</h2>
            <p className="content-page-text">
                מערכת MW Jobs ("השירות") מתחייבת להגן על פרטיותכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, 
                משתמשים ומגנים על המידע האישי שלכם.
            </p>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">2. מידע שאנו אוספים</h2>
            <ul className="content-page-list">
                <li>שם מלא</li>
                <li>מספר תעודת זהות</li>
                <li>מספר טלפון</li>
                <li>עיר מגורים</li>
            </ul>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">3. שימוש במידע</h2>
            <p className="content-page-text">המידע שלכם משמש אותנו לצרכים הבאים:</p>
            <ul className="content-page-list">
                <li>רישום לאירועי עבודה</li>
                <li>יצירת קשר בנוגע לאירועים</li>
                <li>ניהול ואירגון של אירועי עבודה</li>
                <li>שיפור השירות שלנו</li>
            </ul>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">4. שיתוף מידע</h2>
            <p className="content-page-text">
                אנו לא משתפים את המידע האישי שלכם עם צדדים שלישיים, למעט במקרים הבאים:
            </p>
            <ul className="content-page-list">
                <li>כאשר נדרש על פי חוק</li>
                <li>לצורך מתן השירות (כגון Google Sheets לאחסון נתונים)</li>
                <li>בהסכמתכם המפורשת</li>
            </ul>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">5. אבטחת מידע</h2>
            <p className="content-page-text">
                אנו נוקטים אמצעי אבטחה מתקדמים להגנה על המידע שלכם, כולל הצפנה ואחסון מאובטח 
                בשירותי Google Cloud.
            </p>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">6. זכויותיכם</h2>
            <p className="content-page-text">יש לכם זכות:</p>
            <ul className="content-page-list">
                <li>לצפות במידע שלכם</li>
                <li>לבקש תיקון מידע</li>
                <li>לבקש מחיקת מידע</li>
                <li>להתנגד לעיבוד מידע</li>
            </ul>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">7. עדכונים למדיניות</h2>
            <p className="content-page-text">
                אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. עדכונים יפורסמו באתר זה.
            </p>
            </section>

            <section className="content-page-section">
            <h2 className="content-page-subtitle">8. יצירת קשר</h2>
            <p className="content-page-text">
                לשאלות נוספות בנוגע למדיניות הפרטיות, אנא צרו קשר איתנו במייל: 
                <a href="mailto:mwjobs95@gmail.com" className="content-page-link">mwjobs95@gmail.com</a>
            </p>
            </section>

            <div className="content-page-footer">
            <a href="/" className="content-page-back-button">
                חזרה לעמוד הראשי
            </a>
            </div>
        </div>
        </div>
    </>
  );
}
