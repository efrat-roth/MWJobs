import Head from 'next/head';

export default function TermsOfService() {
  return (
    <>
        <Head>
            <title>תנאי שימוש - MW Jobs</title>
            <meta name="description" content="תנאי שימוש למערכת ניהול עובדים לאירועים" />
        </Head>
        
        <div className="landing-container">
            <div className="content-page">
                <h1 className="content-page-title">תנאי שימוש</h1>
                
                <p className="content-page-last-updated">
                    <strong>עדכון אחרון:</strong> {new Date().toLocaleDateString('he-IL')}
                </p>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">1. כללי</h2>
                    <p className="content-page-text">
                    ברוכים הבאים למערכת MW Jobs. השימוש באתר זה כפוף לתנאים המפורטים להלן. 
                    השימוש באתר מהווה הסכמה לתנאים אלה.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">2. מטרת השירות</h2>
                    <p className="content-page-text">
                    המערכת מיועדת לניהול הרשמות לאירועי עבודה. השירות כולל:
                    </p>
                    <ul className="content-page-list">
                    <li>הרשמה לאירועי עבודה</li>
                    <li>ניהול פרטי עובדים</li>
                    <li>תיאום ואירגון אירועים</li>
                    </ul>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">3. חובות המשתמש</h2>
                    <p className="content-page-text">בעת השימוש באתר, אתם מתחייבים:</p>
                    <ul className="content-page-list">
                    <li>לספק מידע נכון ומדויק</li>
                    <li>לא להשתמש באתר למטרות בלתי חוקיות</li>
                    <li>לא לפגוע במערכת או במשתמשים אחרים</li>
                    <li>לשמור על סודיות פרטי גישה</li>
                    </ul>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">4. אחריות והתחייבויות</h2>
                    <p className="content-page-text">
                    השימוש באתר הוא על אחריותכם הבלעדית. איננו אחראים לנזקים שעלולים להיגרם 
                    משימוש או אי-שימוש באתר.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">5. זכויות יוצרים</h2>
                    <p className="content-page-text">
                    כל התוכן באתר מוגן בזכויות יוצרים. אין להעתיק, לשכפל או להפיץ תוכן 
                    מהאתר ללא אישור מפורש.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">6. פרטיות</h2>
                    <p className="content-page-text">
                    השימוש באתר כפוף למדיניות הפרטיות שלנו. אנא קראו את 
                    <a href="/privacy" className="content-page-link"> מדיניות הפרטיות </a>
                    למידע נוסף.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">7. שינויים בתנאים</h2>
                    <p className="content-page-text">
                    אנו רשאים לשנות תנאים אלה מעת לעת. שינויים ייכנסו לתוקף מרגע פרסומם באתר.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">8. ביטול השירות</h2>
                    <p className="content-page-text">
                    אנו רשאים להפסיק את השירות או לחסום משתמשים במקרה של הפרת תנאים אלה.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">9. דין החל</h2>
                    <p className="content-page-text">
                    תנאים אלה כפופים לדיני מדינת ישראל. סמכות השיפוט נתונה לבתי המשפט בישראל.
                    </p>
                </section>

                <section className="content-page-section">
                    <h2 className="content-page-subtitle">10. יצירת קשר</h2>
                    <p className="content-page-text">
                    לשאלות בנוגע לתנאי השימוש, אנא צרו קשר איתנו במייל: 
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
