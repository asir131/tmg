import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { AllCompetitions } from './pages/AllCompetitions';
import { CompetitionDetails } from './pages/CompetitionDetails';
import { Winners } from './pages/Winners';
import { FAQ } from './pages/FAQ';
import { EntryList } from './pages/EntryList';
import { EntryDetail } from './pages/EntryDetail';
import { LiveDraws } from './pages/LiveDraws';
import { CompetitionLiveDetail } from './pages/CompetitionLiveDetail';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { VerifyOtp } from './pages/VerifyOtp';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { PrivateRoute } from './components/PrivateRoute';

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/competitions" element={<AllCompetitions />} />
          <Route path="/competition/:id" element={<CompetitionDetails />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/live-draws" element={<LiveDraws />} />
          <Route path="/live-draw/:id" element={<CompetitionLiveDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route element={<PrivateRoute />}>
            <Route path="/entries" element={<EntryList />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
            <Route path="/profile/*" element={<Profile />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}


