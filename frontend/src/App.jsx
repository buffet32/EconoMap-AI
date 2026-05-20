import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import HeaderD from './components/HeaderD';
import HeaderM from './components/HeaderM';
import Footer from './components/Footer';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Profile from './components/Profile';
import AdashM from './components/AdashM';
import AIFeatures from './components/AIFeatures';
import PremiumAccess from './components/PremiumAccess';
import RegionalDashboard from './components/RegionalDashboard';
import Contact from './components/Contact';
import IntelligencePlatform from './pages/IntelligencePlatform';

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer />
        <HeaderM />
        <HeaderD />
        <div className="pages">
          <Routes>
            <Route path="/" element={<IntelligencePlatform />} />
            <Route path="/intelligence" element={<IntelligencePlatform />} />
            <Route path="/regional-dashboard" element={<RegionalDashboard />} />
            <Route path="/ai-features" element={<AIFeatures />} />
            <Route path="/premium-access" element={<PremiumAccess />} />
            <Route path="/premium-dashboard" element={<Navigate to="/ai-features" replace />} />
            <Route path="/ai-interpretation" element={<Navigate to="/ai-features" replace />} />
            <Route path="/payment" element={<Navigate to="/premium-access" replace />} />
            <Route path="/login" element={<Signin />} />
            <Route path="/Login" element={<Navigate to="/login" replace />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/signup" element={<Navigate to="/Signup" replace />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/profile" element={<Navigate to="/Profile" replace />} />
            <Route path="/AdashM" element={<AdashM />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
