import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      nav: { dashboard: 'Dashboard', missions: 'Missions', stories: 'Stories', chat: 'Chat', video: 'Video Call', community: 'Community', leaderboard: 'Leaderboard', impact: 'Impact', donate: 'Donate', calendar: 'Calendar', admin: 'Admin Panel', scanner: 'QR Scanner', profile: 'Profile', signout: 'Sign out' },
      dashboard: { greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening', impact_score: 'Impact Score', total_hours: 'Total Hours', people_helped: 'People Helped', streak: 'Day Streak', level: 'Level', weekly_activity: 'Weekly Activity', recent_activity: 'Recent Activity', active_sessions: 'Active Sessions', recommendations: 'Recommended for You' },
      missions: { title: 'Missions', urgent: 'URGENT', join: 'Join Mission', leave: 'Leave', active: 'Active', planning: 'Planning', completed: 'Completed', volunteers: 'Volunteers', leader: 'Leader', goal: 'Goal', progress: 'Progress', create: 'Create Mission' },
      common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', loading: 'Loading...', error: 'An error occurred', success: 'Success', submit: 'Submit', search: 'Search', filter: 'Filter', all: 'All', yes: 'Yes', no: 'No' },
      auth: { login: 'Sign In', register: 'Create Account', email: 'Email', password: 'Password', name: 'Full Name', logout: 'Sign Out' },
    }
  },
  am: {
    translation: {
      nav: { dashboard: 'ዳሽቦርድ', missions: 'ተልዕኮዎች', stories: 'ታሪኮች', chat: 'ውይይት', video: 'ቪዲዮ ጥሪ', community: 'ማህበረሰብ', leaderboard: 'ደረጃ ሰሌዳ', impact: 'ተፅዕኖ', donate: 'ለግስ', calendar: 'ቀን መቁጠሪያ', admin: 'አስተዳዳሪ', scanner: 'QR ስካነር', profile: 'መገለጫ', signout: 'ውጣ' },
      dashboard: { greeting_morning: 'ደህና ጠዋት', greeting_afternoon: 'ደህና ቀን', greeting_evening: 'ደህና ሰሃት', impact_score: 'የተፅዕኖ ነጥብ', total_hours: 'ጠቅላላ ሰዓታት', people_helped: 'የተረዱ ሰዎች', streak: 'ቀናት ተከታታይ', level: 'ደረጃ', weekly_activity: 'ሳምንታዊ እንቅስቃሴ', recent_activity: 'የቅርብ ጊዜ እንቅስቃሴ', active_sessions: 'ንቁ ክፍለ ጊዜዎች', recommendations: 'የሚመከር' },
      missions: { title: 'ተልዕኮዎች', urgent: 'አስቸኳይ', join: 'ተልዕኮ ተቀላቀል', leave: 'ውጣ', active: 'ንቁ', planning: 'ዕቅድ', completed: 'ተጠናቅቋል', volunteers: 'በጎ ፈቃደኞች', leader: 'መሪ', goal: 'ዓላማ', progress: 'እድገት', create: 'ተልዕኮ ፍጠር' },
      common: { save: 'አስቀምጥ', cancel: 'ሰርዝ', delete: 'ሰርዝ', loading: 'እየጫነ...', error: 'ስህተት ተፈጥሯል', success: 'ተሳካ', submit: 'አስገባ', search: 'ፈልግ', filter: 'ማጣሪያ', all: 'ሁሉም', yes: 'አዎ', no: 'አይ' },
      auth: { login: 'ግባ', register: 'ተመዝገብ', email: 'ኢሜይል', password: 'የሚስጥር ቃል', name: 'ሙሉ ስም', logout: 'ውጣ' },
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('impacthub_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
